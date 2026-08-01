import type { AnyCircuitElement } from "circuit-json"
import type { PadsGeometryPoint } from "padsts"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import type { CircuitJsonLayer } from "../internal/layers"
import { getCircuitJsonLayer, getLayerSpan } from "../internal/layers"
import { getNumericPinNumber, getTerminalKey } from "../internal/terminals"

interface ResolvedTerminal {
  reference: string
  pinNumber: string
  center: PadsGeometryPoint
  layers: Set<CircuitJsonLayer>
  netNames: Set<string>
}

const LAYER_ORDER: CircuitJsonLayer[] = [
  "top",
  "inner1",
  "inner2",
  "inner3",
  "inner4",
  "inner5",
  "inner6",
  "inner7",
  "inner8",
  "bottom",
]

export const mapPorts = (context: ConversionContext): void => {
  const terminalByKey = new Map<string, ResolvedTerminal>()
  const minimumRouteWidthByNetName = new Map<string, number>()
  for (const path of context.geometry.paths) {
    if (path.kind !== "route" || !path.netName || path.width <= 0) continue
    const currentWidth = minimumRouteWidthByNetName.get(path.netName)
    if (currentWidth === undefined || path.width < currentWidth) {
      minimumRouteWidthByNetName.set(path.netName, path.width)
    }
  }
  const addTerminal = ({
    reference,
    pinNumber,
    center,
    layers,
    netName,
  }: {
    reference: string
    pinNumber: string
    center: PadsGeometryPoint
    layers: CircuitJsonLayer[]
    netName?: string
  }): void => {
    if (layers.length === 0) return
    const terminalKey = getTerminalKey(reference, pinNumber)
    const terminal = terminalByKey.get(terminalKey) ?? {
      reference,
      pinNumber,
      center,
      layers: new Set<CircuitJsonLayer>(),
      netNames: new Set<string>(),
    }
    for (const layer of layers) terminal.layers.add(layer)
    if (netName) terminal.netNames.add(netName)
    terminalByKey.set(terminalKey, terminal)
  }

  for (const pad of context.geometry.pads) {
    const layer = getCircuitJsonLayer(pad.layer, context.geometry.layerCount)
    addTerminal({
      reference: pad.reference,
      pinNumber: pad.pinNumber,
      center: pad.center,
      layers: layer ? [layer] : [],
      netName: pad.netName,
    })
  }
  for (const hole of context.geometry.holes) {
    if (!hole.plated) continue
    addTerminal({
      reference: hole.reference,
      pinNumber: hole.pinNumber,
      center: hole.center,
      layers: getLayerSpan(
        hole.startLayer,
        hole.endLayer,
        context.geometry.layerCount,
      ),
      netName: hole.netName,
    })
  }

  const sourcePortIdsByNetName = new Map<string, string[]>()
  const sortedTerminals = [...terminalByKey.entries()].sort(
    ([firstKey], [secondKey]) => firstKey.localeCompare(secondKey),
  )
  for (const [index, [terminalKey, terminal]] of sortedTerminals.entries()) {
    const componentId = context.componentIdByReference.get(terminal.reference)
    const sourceComponentId = context.sourceComponentIdByReference.get(
      terminal.reference,
    )
    if (!componentId || !sourceComponentId) continue

    const sourcePortId = toStableCircuitJsonId(
      "source_port",
      terminalKey,
      index,
    )
    const pcbPortId = toStableCircuitJsonId("pcb_port", terminalKey, index)
    const numericPinNumber = getNumericPinNumber(terminal.pinNumber)
    const layers = [...terminal.layers].sort(
      (firstLayer, secondLayer) =>
        LAYER_ORDER.indexOf(firstLayer) - LAYER_ORDER.indexOf(secondLayer),
    )
    context.sourcePortIdByTerminal.set(terminalKey, sourcePortId)
    context.pcbPortIdByTerminal.set(terminalKey, pcbPortId)
    context.circuitJson.push(
      {
        type: "source_port",
        source_port_id: sourcePortId,
        source_component_id: sourceComponentId,
        name: terminal.pinNumber,
        port_hints: [terminal.pinNumber],
        ...(numericPinNumber === undefined
          ? {}
          : { pin_number: numericPinNumber }),
      } as AnyCircuitElement,
      {
        type: "pcb_port",
        pcb_port_id: pcbPortId,
        source_port_id: sourcePortId,
        pcb_component_id: componentId,
        x: nanometersToMillimeters(terminal.center.x),
        y: nanometersToMillimeters(terminal.center.y),
        layers,
      } as AnyCircuitElement,
    )
    for (const netName of terminal.netNames) {
      const sourcePortIds = sourcePortIdsByNetName.get(netName) ?? []
      sourcePortIds.push(sourcePortId)
      sourcePortIdsByNetName.set(netName, sourcePortIds)
    }
  }

  for (const [index, [netName, sourceNetId]] of [
    ...context.sourceNetIdByName.entries(),
  ]
    .sort(([firstName], [secondName]) => firstName.localeCompare(secondName))
    .entries()) {
    const sourceTraceId = toStableCircuitJsonId("source_trace", netName, index)
    context.sourceTraceIdByNetName.set(netName, sourceTraceId)
    context.circuitJson.push({
      type: "source_trace",
      source_trace_id: sourceTraceId,
      name: netName,
      connected_source_net_ids: [sourceNetId],
      connected_source_port_ids: [
        ...(sourcePortIdsByNetName.get(netName) ?? []),
      ].sort(),
      ...(minimumRouteWidthByNetName.has(netName)
        ? {
            min_trace_thickness: nanometersToMillimeters(
              minimumRouteWidthByNetName.get(netName)!,
            ),
          }
        : {}),
    } as AnyCircuitElement)
  }
}
