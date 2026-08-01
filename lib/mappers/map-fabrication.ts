import type { AnyCircuitElement } from "circuit-json"
import type {
  PadsGeometryCircle,
  PadsGeometryPath,
  PadsGeometryPoint,
} from "padsts"
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
import { circleToPolylinePoints } from "../internal/polygon"

const getFabricationLayer = (
  entity: PadsGeometryPath | PadsGeometryCircle,
): "top" | "bottom" | undefined =>
  entity.gerberLayer === "F_Fab"
    ? "top"
    : entity.gerberLayer === "B_Fab"
      ? "bottom"
      : undefined

const addFabricationPath = ({
  context,
  entity,
  index,
  points,
  segmentedCurves,
}: {
  context: ConversionContext
  entity: PadsGeometryPath | PadsGeometryCircle
  index: number
  points: PadsGeometryPoint[]
  segmentedCurves: boolean
}): void => {
  const layer = getFabricationLayer(entity)
  const componentId = entity.reference
    ? context.componentIdByReference.get(entity.reference)
    : undefined
  if (!layer || !componentId) return

  const fabricationPathId = toStableCircuitJsonId(
    "pcb_fabrication_note_path",
    entity.source?.sourceId,
    index,
  )
  context.circuitJson.push({
    type: "pcb_fabrication_note_path",
    pcb_fabrication_note_path_id: fabricationPathId,
    pcb_component_id: componentId,
    layer,
    route: points.map(toCircuitJsonPoint),
    stroke_width: nanometersToMillimeters(entity.width),
  } as AnyCircuitElement)
  context.mappedEntities.add(entity)

  if ("points" in entity) context.handledPaths.add(entity)
  else context.handledCircles.add(entity)
  if (segmentedCurves) {
    context.diagnostics.push(
      createApproximationDiagnostic({
        code: "circuit-json-fabrication-curves-segmented",
        message:
          "Segmented circular fabrication geometry into Circuit JSON path edges at no more than five degrees per segment",
        entity,
        circuitJsonIds: [fabricationPathId],
        fallbackSource: context.documentSource,
      }),
    )
  }
}

export const mapFabrication = (context: ConversionContext): void => {
  for (const [index, path] of context.geometry.paths.entries()) {
    if (path.kind !== "drawing" || !getFabricationLayer(path)) continue
    const componentId = path.reference
      ? context.componentIdByReference.get(path.reference)
      : undefined
    if (!componentId) {
      context.handledPaths.add(path)
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-fabrication-component-unavailable",
          message:
            "Skipped fabrication artwork because Circuit JSON requires an emitted component owner",
          entity: path,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }
    addFabricationPath({
      context,
      entity: path,
      index,
      points: pathToPolylinePoints(path),
      segmentedCurves: pathHasArcs(path),
    })
  }

  for (const [index, circle] of context.geometry.circles.entries()) {
    if (circle.kind !== "drawing" || !getFabricationLayer(circle)) continue
    const componentId = circle.reference
      ? context.componentIdByReference.get(circle.reference)
      : undefined
    if (!componentId) {
      context.handledCircles.add(circle)
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-fabrication-component-unavailable",
          message:
            "Skipped fabrication artwork because Circuit JSON requires an emitted component owner",
          entity: circle,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }
    const points = circleToPolylinePoints(circle)
    points.push(points[0]!)
    addFabricationPath({
      context,
      entity: circle,
      index: context.geometry.paths.length + index,
      points,
      segmentedCurves: true,
    })
  }
}
