import type { AnyCircuitElement } from "circuit-json"
import type { PadsGeometryHole, PadsGeometryPad } from "padsts"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import { createSkippedDiagnostic } from "../internal/diagnostics"
import { getLayerSpan } from "../internal/layers"
import { getPlatedHoleShape } from "../internal/plated-hole-shape"
import { getTerminalKey } from "../internal/terminals"

const mapNonPlatedHole = (
  hole: PadsGeometryHole,
  holeId: string,
  componentId: string | undefined,
): AnyCircuitElement => {
  const circular = Math.abs(hole.width - hole.height) < 1e-6
  return (
    circular
      ? {
          type: "pcb_hole",
          pcb_hole_id: holeId,
          pcb_component_id: componentId,
          hole_shape: "circle",
          hole_diameter: nanometersToMillimeters(hole.width),
          x: nanometersToMillimeters(hole.center.x),
          y: nanometersToMillimeters(hole.center.y),
        }
      : {
          type: "pcb_hole",
          pcb_hole_id: holeId,
          pcb_component_id: componentId,
          hole_shape: "rotated_pill",
          hole_width: nanometersToMillimeters(hole.width),
          hole_height: nanometersToMillimeters(hole.height),
          ccw_rotation: hole.rotation,
          x: nanometersToMillimeters(hole.center.x),
          y: nanometersToMillimeters(hole.center.y),
        }
  ) as AnyCircuitElement
}

const mapPlatedHole = (
  hole: PadsGeometryHole,
  holeId: string,
  componentId: string | undefined,
  layerCount: number,
  pcbPortId: string | undefined,
  pad: PadsGeometryPad | undefined,
): AnyCircuitElement => {
  const layers = getLayerSpan(hole.startLayer, hole.endLayer, layerCount)
  return {
    type: "pcb_plated_hole",
    pcb_plated_hole_id: holeId,
    pcb_component_id: componentId,
    pcb_port_id: pcbPortId,
    layers,
    ...getPlatedHoleShape({ hole, pad }),
  } as AnyCircuitElement
}

export const mapHoles = (context: ConversionContext): void => {
  for (const [index, hole] of context.geometry.holes.entries()) {
    const componentId = context.componentIdByReference.get(hole.reference)
    if (!componentId) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-hole-component-reference-unresolved",
          message: `Skipped ${hole.reference}.${hole.pinNumber} because its component reference was not emitted`,
          entity: hole,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }
    const id = toStableCircuitJsonId(
      hole.plated ? "pcb_plated_hole" : "pcb_hole",
      hole.source?.sourceId,
      index,
    )
    const associatedPad = hole.plated
      ? context.geometry.pads.find(
          (pad) =>
            pad.reference === hole.reference &&
            pad.pinNumber === hole.pinNumber,
        )
      : undefined
    context.circuitJson.push(
      hole.plated
        ? mapPlatedHole(
            hole,
            id,
            componentId,
            context.geometry.layerCount,
            context.pcbPortIdByTerminal.get(
              getTerminalKey(hole.reference, hole.pinNumber),
            ),
            associatedPad,
          )
        : mapNonPlatedHole(hole, id, componentId),
    )
    context.mappedEntities.add(hole)
    if (associatedPad) context.mappedEntities.add(associatedPad)
  }
}
