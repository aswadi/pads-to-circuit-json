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

export const mapSilkscreen = (context: ConversionContext): void => {
  for (const [index, path] of context.geometry.paths.entries()) {
    const isSilkscreen =
      path.kind === "drawing" &&
      (path.gerberLayer === "F_Silkscreen" ||
        path.gerberLayer === "B_Silkscreen")
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
      layer: path.gerberLayer === "B_Silkscreen" ? "bottom" : "top",
      route: pathToPolylinePoints(path).map(toCircuitJsonPoint),
      stroke_width: nanometersToMillimeters(path.width),
    } as AnyCircuitElement)

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
}
