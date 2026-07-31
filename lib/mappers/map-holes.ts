import type { AnyCircuitElement } from "circuit-json"
import type { PadsGeometryHole } from "padsts"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import { getLayerSpan } from "../internal/layers"

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
): AnyCircuitElement => {
  const circular = Math.abs(hole.width - hole.height) < 1e-6
  const layers = getLayerSpan(hole.startLayer, hole.endLayer, layerCount)
  return (
    circular
      ? {
          type: "pcb_plated_hole",
          pcb_plated_hole_id: holeId,
          pcb_component_id: componentId,
          shape: "circle",
          x: nanometersToMillimeters(hole.center.x),
          y: nanometersToMillimeters(hole.center.y),
          hole_diameter: nanometersToMillimeters(hole.width),
          outer_diameter: nanometersToMillimeters(hole.width),
          layers,
        }
      : {
          type: "pcb_plated_hole",
          pcb_plated_hole_id: holeId,
          pcb_component_id: componentId,
          shape: "oval",
          x: nanometersToMillimeters(hole.center.x),
          y: nanometersToMillimeters(hole.center.y),
          hole_width: nanometersToMillimeters(hole.width),
          hole_height: nanometersToMillimeters(hole.height),
          outer_width: nanometersToMillimeters(hole.width),
          outer_height: nanometersToMillimeters(hole.height),
          ccw_rotation: hole.rotation,
          layers,
        }
  ) as AnyCircuitElement
}

export const mapHoles = (context: ConversionContext): void => {
  for (const [index, hole] of context.geometry.holes.entries()) {
    const componentId = context.componentIdByReference.get(hole.reference)
    const id = toStableCircuitJsonId(
      hole.plated ? "pcb_plated_hole" : "pcb_hole",
      hole.source?.sourceId,
      index,
    )
    context.circuitJson.push(
      hole.plated
        ? mapPlatedHole(hole, id, componentId, context.geometry.layerCount)
        : mapNonPlatedHole(hole, id, componentId),
    )
  }
}
