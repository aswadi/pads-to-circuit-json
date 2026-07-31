import type { AnyCircuitElement } from "circuit-json"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toCircuitJsonPoint,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import { createSkippedDiagnostic } from "../internal/diagnostics"
import { getComponentBounds } from "../internal/geometry"

export const mapComponents = (context: ConversionContext): void => {
  for (const [index, placement] of context.geometry.placements.entries()) {
    const bounds = getComponentBounds(context.geometry, placement.reference)
    if (!bounds) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-component-bounds-unavailable",
          message: `Skipped ${placement.reference} because no decoded footprint geometry establishes its dimensions`,
          entity: placement,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const componentId = toStableCircuitJsonId(
      "pcb_component",
      placement.source?.sourceId,
      index,
    )
    context.componentIdByReference.set(placement.reference, componentId)
    context.circuitJson.push({
      type: "pcb_component",
      pcb_component_id: componentId,
      source_component_id: `source_component_${placement.reference}`,
      center: toCircuitJsonPoint(placement.location),
      layer: placement.bottomLayer ? "bottom" : "top",
      rotation: placement.rotation,
      width: nanometersToMillimeters(bounds.maximumX - bounds.minimumX),
      height: nanometersToMillimeters(bounds.maximumY - bounds.minimumY),
      positioned_relative_to_pcb_board_id: context.outline
        ? context.boardId
        : undefined,
    } as AnyCircuitElement)
  }
}
