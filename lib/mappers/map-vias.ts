import type { AnyCircuitElement } from "circuit-json"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import {
  createApproximationDiagnostic,
  createSkippedDiagnostic,
} from "../internal/diagnostics"
import { getLayerSpan } from "../internal/layers"

export const mapVias = (context: ConversionContext): void => {
  for (const [index, circle] of context.geometry.circles.entries()) {
    if (circle.kind !== "via") continue
    context.handledCircles.add(circle)
    if (circle.drillRadius === undefined) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-undrilled-via-not-represented",
          message: "Skipped a via circle because no drill diameter was decoded",
          entity: circle,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const startLayer = Math.trunc(circle.startLayer ?? 1)
    const endLayer = Math.trunc(circle.endLayer ?? context.geometry.layerCount)
    const layers = getLayerSpan(
      startLayer,
      endLayer,
      context.geometry.layerCount,
    )
    if (layers.length === 0) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-via-layers-unavailable",
          message:
            "Skipped a via because its layer span has no Circuit JSON layer mapping",
          entity: circle,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const outerRadius = Math.max(
      circle.radius,
      ...(circle.copperPads ?? []).map(({ radius }) => radius),
    )
    const viaId = toStableCircuitJsonId(
      "pcb_via",
      circle.source?.sourceId,
      index,
    )
    const pcbTraceId = circle.netName
      ? context.pcbTraceIdByNetName.get(circle.netName)
      : undefined
    context.circuitJson.push({
      type: "pcb_via",
      pcb_via_id: viaId,
      x: nanometersToMillimeters(circle.center.x),
      y: nanometersToMillimeters(circle.center.y),
      outer_diameter: nanometersToMillimeters(outerRadius * 2),
      hole_diameter: nanometersToMillimeters(circle.drillRadius * 2),
      layers,
      ...(pcbTraceId ? { pcb_trace_id: pcbTraceId } : {}),
    } as AnyCircuitElement)
    context.mappedEntities.add(circle)

    const padStackKeys = new Set(
      (circle.copperPads ?? []).map(
        ({ radius, shape }) => `${radius}:${shape}`,
      ),
    )
    const losesPadStackDetail =
      padStackKeys.size > 1 ||
      (circle.copperPads ?? []).some(({ shape }) => shape !== "circle")
    if (losesPadStackDetail) {
      context.diagnostics.push(
        createApproximationDiagnostic({
          code: "circuit-json-via-pad-stack-approximated",
          message:
            "Collapsed per-layer via pad sizes or shapes to one circular maximum outer diameter",
          entity: circle,
          circuitJsonIds: [viaId],
          fallbackSource: context.documentSource,
        }),
      )
    }
    if (circle.netName && !pcbTraceId) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-via-net-association-not-represented",
          message: `Emitted via geometry but could not attach its decoded PADS net ${JSON.stringify(circle.netName)} because that net has no emitted routed PCB trace`,
          entity: circle,
          fallbackSource: context.documentSource,
        }),
      )
    }
  }
}
