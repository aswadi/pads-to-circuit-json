import type { AnyCircuitElement } from "circuit-json"
import type { PadsGeometryPad } from "padsts"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import { createSkippedDiagnostic } from "../internal/diagnostics"
import { getCircuitJsonLayer } from "../internal/layers"
import { getTerminalKey } from "../internal/terminals"

const getPadShape = (pad: PadsGeometryPad): Record<string, unknown> => {
  if (pad.chamfered && (pad.cornerRadius ?? 0) > 0) {
    const halfWidth = pad.width / 2
    const halfHeight = pad.height / 2
    const corner = Math.min(
      Math.abs(pad.cornerRadius ?? 0),
      halfWidth,
      halfHeight,
    )
    const rotationRadians = (pad.rotation * Math.PI) / 180
    const rotatePoint = ({ x, y }: { x: number; y: number }) => ({
      x: nanometersToMillimeters(
        pad.center.x +
          x * Math.cos(rotationRadians) -
          y * Math.sin(rotationRadians),
      ),
      y: nanometersToMillimeters(
        pad.center.y +
          x * Math.sin(rotationRadians) +
          y * Math.cos(rotationRadians),
      ),
    })
    return {
      shape: "polygon",
      points: [
        { x: -halfWidth + corner, y: -halfHeight },
        { x: halfWidth - corner, y: -halfHeight },
        { x: halfWidth, y: -halfHeight + corner },
        { x: halfWidth, y: halfHeight - corner },
        { x: halfWidth - corner, y: halfHeight },
        { x: -halfWidth + corner, y: halfHeight },
        { x: -halfWidth, y: halfHeight - corner },
        { x: -halfWidth, y: -halfHeight + corner },
      ].map(rotatePoint),
    }
  }

  const center = {
    x: nanometersToMillimeters(pad.center.x),
    y: nanometersToMillimeters(pad.center.y),
  }
  if (pad.shape === "circle") {
    return {
      ...center,
      shape: "circle",
      radius: nanometersToMillimeters(Math.min(pad.width, pad.height) / 2),
    }
  }
  if (pad.shape === "oval") {
    return {
      ...center,
      shape: pad.rotation === 0 ? "pill" : "rotated_pill",
      width: nanometersToMillimeters(pad.width),
      height: nanometersToMillimeters(pad.height),
      radius: nanometersToMillimeters(Math.min(pad.width, pad.height) / 2),
      ...(pad.rotation === 0 ? {} : { ccw_rotation: pad.rotation }),
    }
  }
  return {
    ...center,
    shape: pad.rotation === 0 ? "rect" : "rotated_rect",
    width: nanometersToMillimeters(pad.width),
    height: nanometersToMillimeters(pad.height),
    ...(pad.cornerRadius && !pad.chamfered
      ? { rect_border_radius: nanometersToMillimeters(pad.cornerRadius) }
      : {}),
    ...(pad.rotation === 0 ? {} : { ccw_rotation: pad.rotation }),
  }
}

export const mapPads = (context: ConversionContext): void => {
  for (const [index, pad] of context.geometry.pads.entries()) {
    const hasAssociatedPlatedHole = context.geometry.holes.some(
      (hole) =>
        hole.plated &&
        hole.reference === pad.reference &&
        hole.pinNumber === pad.pinNumber,
    )
    if (hasAssociatedPlatedHole) continue

    const layer = getCircuitJsonLayer(pad.layer, context.geometry.layerCount)
    if (!layer) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-pad-layer-unavailable",
          message: `Skipped ${pad.reference}.${pad.pinNumber} because PADS layer ${pad.layer} has no Circuit JSON layer mapping`,
          entity: pad,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }
    const componentId = context.componentIdByReference.get(pad.reference)
    if (!componentId) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-pad-component-reference-unresolved",
          message: `Skipped ${pad.reference}.${pad.pinNumber} because its component reference was not emitted`,
          entity: pad,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const padId = toStableCircuitJsonId(
      "pcb_smtpad",
      pad.source?.sourceId,
      index,
    )
    const pcbPortId = context.pcbPortIdByTerminal.get(
      getTerminalKey(pad.reference, pad.pinNumber),
    )
    context.circuitJson.push({
      type: "pcb_smtpad",
      pcb_smtpad_id: padId,
      pcb_component_id: componentId,
      ...(pcbPortId ? { pcb_port_id: pcbPortId } : {}),
      layer,
      ...getPadShape(pad),
    } as AnyCircuitElement)
    context.mappedEntities.add(pad)
  }
}
