import type { AnyCircuitElement } from "circuit-json"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toCircuitJsonPoint,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import {
  createInferredDiagnostic,
  createSkippedDiagnostic,
} from "../internal/diagnostics"
import { getComponentBoundsByReference } from "../internal/geometry"

export const mapComponents = (context: ConversionContext): void => {
  const boundsByReference = getComponentBoundsByReference(context.geometry)
  for (const [index, placement] of context.geometry.placements.entries()) {
    if (context.componentIdByReference.has(placement.reference)) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-duplicate-component-reference",
          message: `Skipped a duplicate PADS component reference ${placement.reference}`,
          entity: placement,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }
    const bounds = boundsByReference.get(placement.reference)
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
    const sourceComponentId = toStableCircuitJsonId(
      "source_component",
      placement.source?.sourceId,
      index,
    )
    context.componentIdByReference.set(placement.reference, componentId)
    context.sourceComponentIdByReference.set(
      placement.reference,
      sourceComponentId,
    )
    context.circuitJson.push({
      type: "source_component",
      source_component_id: sourceComponentId,
      ftype: "simple_chip",
      name: placement.reference,
      display_name: placement.reference,
      display_value: placement.partTypeName,
    } as AnyCircuitElement)
    context.circuitJson.push({
      type: "pcb_component",
      pcb_component_id: componentId,
      source_component_id: sourceComponentId,
      center: toCircuitJsonPoint(placement.location),
      layer: placement.bottomLayer ? "bottom" : "top",
      rotation: placement.rotation,
      width: nanometersToMillimeters(bounds.maximumX - bounds.minimumX),
      height: nanometersToMillimeters(bounds.maximumY - bounds.minimumY),
      positioned_relative_to_pcb_board_id: context.outline
        ? context.boardId
        : undefined,
    } as AnyCircuitElement)
    context.mappedEntities.add(placement)
    context.diagnostics.push(
      createInferredDiagnostic({
        code: "circuit-json-source-component-type-inferred",
        message: `Emitted ${placement.reference} as a generic simple_chip because normalized PADS placement geometry does not identify its Circuit JSON source component type`,
        entity: placement,
        circuitJsonIds: [sourceComponentId, componentId],
        fallbackSource: context.documentSource,
      }),
    )
  }
}
