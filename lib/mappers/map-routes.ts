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
import { getPathCircuitJsonLayer } from "../internal/layers"
import { pathHasArcs, pathToPolylinePoints } from "../internal/path-to-polyline"

export const mapRoutes = (context: ConversionContext): void => {
  for (const [index, path] of context.geometry.paths.entries()) {
    if (path.kind !== "route") continue
    context.handledPaths.add(path)
    const layer = getPathCircuitJsonLayer(path, context.geometry)
    if (!layer || path.points.length < 2) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-route-not-exactly-representable",
          message:
            "Skipped a route whose layer or point geometry is not representable by the current adapter",
          entity: path,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const traceId = toStableCircuitJsonId(
      "pcb_trace",
      path.source?.sourceId,
      index,
    )
    const sourceTraceId = path.netName
      ? context.sourceTraceIdByNetName.get(path.netName)
      : undefined
    context.circuitJson.push({
      type: "pcb_trace",
      pcb_trace_id: traceId,
      ...(sourceTraceId ? { source_trace_id: sourceTraceId } : {}),
      route: pathToPolylinePoints(path).map((point) => ({
        route_type: "wire",
        ...toCircuitJsonPoint(point),
        width: nanometersToMillimeters(path.width),
        layer,
      })),
    } as AnyCircuitElement)
    context.mappedEntities.add(path)
    if (path.netName && !context.pcbTraceIdByNetName.has(path.netName)) {
      context.pcbTraceIdByNetName.set(path.netName, traceId)
    }

    if (pathHasArcs(path)) {
      context.diagnostics.push(
        createApproximationDiagnostic({
          code: "circuit-json-route-arcs-segmented",
          message:
            "Segmented circular route arcs into Circuit JSON trace wires at no more than five degrees per segment",
          entity: path,
          circuitJsonIds: [traceId],
          fallbackSource: context.documentSource,
        }),
      )
    }
  }
}
