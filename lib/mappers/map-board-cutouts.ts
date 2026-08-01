import type { AnyCircuitElement } from "circuit-json"
import type { PadsGeometryPath, PadsGeometryPoint } from "padsts"
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
import {
  polygonContainsPoint,
  polygonContainsPolygon,
} from "../internal/polygon"

const getCircleFromDiameter = (
  path: PadsGeometryPath,
): { center: PadsGeometryPoint; radius: number } | undefined => {
  if (path.sourcePieceKind !== "BRDCIR" || path.points.length < 2) {
    return undefined
  }
  const [first, second] = path.points
  if (!first || !second) return undefined
  return {
    center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    radius: Math.hypot(second.x - first.x, second.y - first.y) / 2,
  }
}

const circleFitsBoard = ({
  center,
  radius,
  outlinePoints,
}: {
  center: PadsGeometryPoint
  radius: number
  outlinePoints: PadsGeometryPoint[]
}): boolean =>
  [
    center,
    { x: center.x - radius, y: center.y },
    { x: center.x + radius, y: center.y },
    { x: center.x, y: center.y - radius },
    { x: center.x, y: center.y + radius },
  ].every((point) => polygonContainsPoint(outlinePoints, point))

const addCircularCutout = ({
  context,
  entity,
  index,
  center,
  radius,
}: {
  context: ConversionContext
  entity: PadsGeometryPath | ConversionContext["geometry"]["circles"][number]
  index: number
  center: PadsGeometryPoint
  radius: number
}): void => {
  if (!context.outline || radius <= 0) return
  if (
    !circleFitsBoard({ center, radius, outlinePoints: context.outline.points })
  ) {
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: "circuit-json-board-circle-not-contained",
        message:
          "Skipped a circular BOARD piece because it is not fully contained by the selected outer board outline",
        entity,
        fallbackSource: context.documentSource,
      }),
    )
    return
  }

  const cutoutId = toStableCircuitJsonId(
    "pcb_cutout",
    entity.source?.sourceId,
    index,
  )
  context.circuitJson.push({
    type: "pcb_cutout",
    pcb_cutout_id: cutoutId,
    pcb_board_id: context.boardId,
    shape: "circle",
    center: toCircuitJsonPoint(center),
    radius: nanometersToMillimeters(radius),
  } as AnyCircuitElement)
  context.mappedEntities.add(entity)
}

export const mapBoardCutouts = (context: ConversionContext): void => {
  if (!context.outline) return

  let cutoutIndex = 0
  for (const circle of context.geometry.circles) {
    if (circle.kind !== "outline") continue
    context.handledCircles.add(circle)
    addCircularCutout({
      context,
      entity: circle,
      index: cutoutIndex++,
      center: circle.center,
      radius: circle.radius,
    })
  }

  for (const path of context.geometry.paths) {
    if (path === context.outline || path.kind !== "outline") continue
    context.handledPaths.add(path)

    const circle = getCircleFromDiameter(path)
    if (circle) {
      addCircularCutout({
        context,
        entity: path,
        index: cutoutIndex++,
        ...circle,
      })
      continue
    }

    const points = pathToPolylinePoints(path)
    if (
      !path.closed ||
      points.length < 3 ||
      !polygonContainsPolygon(context.outline.points, points)
    ) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-additional-board-outline-not-a-cutout",
          message:
            "Skipped an additional BOARD contour because it is not a closed contour fully contained by the selected outer board outline",
          entity: path,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const cutoutId = toStableCircuitJsonId(
      "pcb_cutout",
      path.source?.sourceId,
      cutoutIndex++,
    )
    context.circuitJson.push({
      type: "pcb_cutout",
      pcb_cutout_id: cutoutId,
      pcb_board_id: context.boardId,
      shape: "polygon",
      points: points.map(toCircuitJsonPoint),
    } as AnyCircuitElement)
    context.mappedEntities.add(path)

    if (pathHasArcs(path)) {
      context.diagnostics.push(
        createApproximationDiagnostic({
          code: "circuit-json-board-cutout-arcs-segmented",
          message:
            "Segmented circular board-cutout arcs into Circuit JSON polygon edges at no more than five degrees per segment",
          entity: path,
          circuitJsonIds: [cutoutId],
          fallbackSource: context.documentSource,
        }),
      )
    }
  }
}
