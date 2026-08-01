import type { AnyCircuitElement } from "circuit-json"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toCircuitJsonPoint,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import {
  createApproximationDiagnostic,
  createSkippedDiagnostic,
} from "../internal/diagnostics"
import { pathHasArcs, pathToPolylinePoints } from "../internal/path-to-polyline"
import { mapSilkscreenText } from "./map-silkscreen-text"

const getSilkscreenLayer = ({
  gerberLayer,
}: {
  gerberLayer?: string
}): "top" | "bottom" | undefined =>
  gerberLayer === "F_Silkscreen"
    ? "top"
    : gerberLayer === "B_Silkscreen"
      ? "bottom"
      : undefined

export const mapSilkscreen = (context: ConversionContext): void => {
  for (const [index, path] of context.geometry.paths.entries()) {
    const isSilkscreen = path.kind === "drawing" && getSilkscreenLayer(path)
    if (!isSilkscreen) continue

    context.handledPaths.add(path)
    const componentId = path.reference
      ? context.componentIdByReference.get(path.reference)
      : undefined
    if (!componentId) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-silkscreen-component-unavailable",
          message:
            "Skipped a silkscreen path because its decoded component was not emitted",
          entity: path,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const silkscreenPathId = toStableCircuitJsonId(
      "pcb_silkscreen_path",
      path.source?.sourceId,
      index,
    )
    context.circuitJson.push({
      type: "pcb_silkscreen_path",
      pcb_silkscreen_path_id: silkscreenPathId,
      pcb_component_id: componentId,
      layer: getSilkscreenLayer(path)!,
      route: pathToPolylinePoints(path).map(toCircuitJsonPoint),
      stroke_width: nanometersToMillimeters(path.width),
    } as AnyCircuitElement)
    context.mappedEntities.add(path)

    if (pathHasArcs(path)) {
      context.diagnostics.push(
        createApproximationDiagnostic({
          code: "circuit-json-silkscreen-arcs-segmented",
          message:
            "Segmented circular silkscreen arcs into Circuit JSON path edges at no more than five degrees per segment",
          entity: path,
          circuitJsonIds: [silkscreenPathId],
          fallbackSource: context.documentSource,
        }),
      )
    }
  }

  for (const [index, circle] of context.geometry.circles.entries()) {
    const layer = getSilkscreenLayer(circle)
    if (circle.kind !== "drawing" || !layer) continue
    context.handledCircles.add(circle)
    const componentId = circle.reference
      ? context.componentIdByReference.get(circle.reference)
      : undefined
    if (!componentId) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-silkscreen-component-unavailable",
          message:
            "Skipped a silkscreen circle because its decoded component was not emitted",
          entity: circle,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const silkscreenCircleId = toStableCircuitJsonId(
      "pcb_silkscreen_circle",
      circle.source?.sourceId,
      index,
    )
    context.circuitJson.push({
      type: "pcb_silkscreen_circle",
      pcb_silkscreen_circle_id: silkscreenCircleId,
      pcb_component_id: componentId,
      center: toCircuitJsonPoint(circle.center),
      radius: nanometersToMillimeters(circle.radius),
      layer,
      stroke_width: nanometersToMillimeters(circle.width),
      is_filled: false,
    } as AnyCircuitElement)
    context.mappedEntities.add(circle)
  }

  mapSilkscreenText(context)
}
