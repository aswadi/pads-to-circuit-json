import type { AnyCircuitElement } from "circuit-json"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toCircuitJsonPoint,
} from "../internal/coordinates"
import {
  createApproximationDiagnostic,
  createSkippedDiagnostic,
} from "../internal/diagnostics"
import { pathHasArcs, pathToPolylinePoints } from "../internal/path-to-polyline"

export const mapBoard = (context: ConversionContext): void => {
  const { outline } = context
  if (!outline) {
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: "circuit-json-board-outline-unavailable",
        message:
          "Circuit JSON board output requires a closed, line-segment-only board outline",
        fallbackSource: context.documentSource,
      }),
    )
    return
  }

  context.handledPaths.add(outline)
  const outlinePoints = pathToPolylinePoints(outline)
  const minimumX = Math.min(...outlinePoints.map(({ x }) => x))
  const minimumY = Math.min(...outlinePoints.map(({ y }) => y))
  const maximumX = Math.max(...outlinePoints.map(({ x }) => x))
  const maximumY = Math.max(...outlinePoints.map(({ y }) => y))
  context.circuitJson.push({
    type: "pcb_board",
    pcb_board_id: context.boardId,
    shape: "polygon",
    center: {
      x: nanometersToMillimeters((minimumX + maximumX) / 2),
      y: nanometersToMillimeters((minimumY + maximumY) / 2),
    },
    width: nanometersToMillimeters(maximumX - minimumX),
    height: nanometersToMillimeters(maximumY - minimumY),
    num_layers: context.geometry.layerCount,
    outline: outlinePoints.map(toCircuitJsonPoint),
    material: "fr4",
  } as AnyCircuitElement)
  context.mappedEntities.add(outline)

  if (context.geometry.layerCount > 10) {
    context.diagnostics.push(
      createApproximationDiagnostic({
        code: "circuit-json-layer-stack-partially-named",
        message: `Preserved the ${context.geometry.layerCount}-layer board count, but Circuit JSON currently names at most eight inner copper layers`,
        entity: outline,
        circuitJsonIds: [context.boardId],
        fallbackSource: context.documentSource,
      }),
    )
  }

  if (pathHasArcs(outline)) {
    context.diagnostics.push(
      createApproximationDiagnostic({
        code: "circuit-json-board-arcs-segmented",
        message:
          "Segmented circular board-outline arcs into Circuit JSON polygon edges at no more than five degrees per segment",
        entity: outline,
        circuitJsonIds: [context.boardId],
        fallbackSource: context.documentSource,
      }),
    )
  }
}
