import type { AnyCircuitElement } from "circuit-json"
import type {
  PadsGeometryCircle,
  PadsGeometryPath,
  PadsGeometryPoint,
} from "padsts"
import type { ConversionContext } from "../internal/conversion-context"
import {
  toCircuitJsonPoint,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import { createApproximationDiagnostic } from "../internal/diagnostics"
import {
  type CircuitJsonLayer,
  getCopperCircuitJsonLayer,
  layerWasDefaultedToTop,
} from "../internal/layers"
import { pathHasArcs, pathToPolylinePoints } from "../internal/path-to-polyline"
import {
  circleToPolylinePoints,
  getPolygonArea,
  polygonContainsPolygon,
  withoutRepeatedClosingPoint,
} from "../internal/polygon"

interface CopperRing {
  entity: PadsGeometryPath | PadsGeometryCircle
  fallbackIndex: number
  layer: CircuitJsonLayer
  points: PadsGeometryPoint[]
  isCircle: boolean
}

const getCopperRings = (
  context: ConversionContext,
  polarity: "positive" | "negative",
): CopperRing[] => [
  ...context.geometry.paths.flatMap((path, index) => {
    const layer = getCopperCircuitJsonLayer(path, context.geometry)
    return path.kind === "copper" &&
      (path.polarity ?? "positive") === polarity &&
      path.closed &&
      path.points.length >= 3 &&
      layer
      ? [
          {
            entity: path,
            fallbackIndex: index,
            layer,
            points: withoutRepeatedClosingPoint(pathToPolylinePoints(path)),
            isCircle: false,
          },
        ]
      : []
  }),
  ...context.geometry.circles.flatMap((circle, index) => {
    const layer = getCopperCircuitJsonLayer(circle, context.geometry)
    return circle.kind === "copper" &&
      (circle.polarity ?? "positive") === polarity &&
      circle.radius > 0 &&
      layer
      ? [
          {
            entity: circle,
            fallbackIndex: context.geometry.paths.length + index,
            layer,
            points: circleToPolylinePoints({
              center: circle.center,
              radius:
                Math.abs(circle.radius) +
                (polarity === "negative" ? Math.abs(circle.width) / 2 : 0),
            }),
            isCircle: true,
          },
        ]
      : []
  }),
]

const addRingDiagnostics = ({
  context,
  ring,
  copperPourId,
}: {
  context: ConversionContext
  ring: CopperRing
  copperPourId: string
}): void => {
  const { entity } = ring
  if (ring.isCircle || ("segments" in entity && pathHasArcs(entity))) {
    context.diagnostics.push(
      createApproximationDiagnostic({
        code: "circuit-json-copper-curves-segmented",
        message:
          "Segmented circular copper geometry into Circuit JSON BRep edges at no more than five degrees per segment",
        entity,
        circuitJsonIds: [copperPourId],
        fallbackSource: context.documentSource,
      }),
    )
  }
  if (!ring.isCircle && entity.width > 0) {
    context.diagnostics.push(
      createApproximationDiagnostic({
        code: "circuit-json-copper-boundary-stroke-omitted",
        message:
          "Mapped the filled copper boundary but omitted its separate PADS outline stroke width",
        entity,
        circuitJsonIds: [copperPourId],
        fallbackSource: context.documentSource,
      }),
    )
  }
}

export const mapCopperRegions = (context: ConversionContext): void => {
  const positiveRings = getCopperRings(context, "positive")
  const negativeRings = getCopperRings(context, "negative")
  const innerRingsByOuter = new Map<CopperRing, CopperRing[]>()

  for (const innerRing of negativeRings) {
    const owner = positiveRings
      .filter(
        (outerRing) =>
          outerRing.layer === innerRing.layer &&
          polygonContainsPolygon(outerRing.points, innerRing.points),
      )
      .sort(
        (first, second) =>
          getPolygonArea(first.points) - getPolygonArea(second.points),
      )[0]
    if (!owner) continue
    const rings = innerRingsByOuter.get(owner) ?? []
    rings.push(innerRing)
    innerRingsByOuter.set(owner, rings)
  }

  for (const outerRing of positiveRings) {
    const copperPourId = toStableCircuitJsonId(
      "pcb_copper_pour",
      outerRing.entity.source?.sourceId,
      outerRing.fallbackIndex,
    )
    const innerRings = innerRingsByOuter.get(outerRing) ?? []
    context.circuitJson.push({
      type: "pcb_copper_pour",
      pcb_copper_pour_id: copperPourId,
      shape: "brep",
      layer: outerRing.layer,
      ...(outerRing.entity.netName
        ? {
            source_net_id: context.sourceNetIdByName.get(
              outerRing.entity.netName,
            ),
          }
        : {}),
      covered_with_solder_mask: true,
      brep_shape: {
        outer_ring: {
          vertices: outerRing.points.map(toCircuitJsonPoint),
        },
        inner_rings: innerRings.map((ring) => ({
          vertices: ring.points.map(toCircuitJsonPoint),
        })),
      },
    } as AnyCircuitElement)
    context.mappedEntities.add(outerRing.entity)
    for (const ring of innerRings) context.mappedEntities.add(ring.entity)

    if (layerWasDefaultedToTop(outerRing.entity)) {
      context.diagnostics.push(
        createApproximationDiagnostic({
          code: "circuit-json-copper-layer-defaulted-to-top",
          message:
            "Mapped PADS copper with normalized layer 0 to top copper; verify the original line-section level",
          entity: outerRing.entity,
          circuitJsonIds: [copperPourId],
          fallbackSource: context.documentSource,
        }),
      )
    }

    if ("kind" in outerRing.entity && outerRing.entity.kind === "copper") {
      if ("points" in outerRing.entity) {
        context.handledPaths.add(outerRing.entity)
      } else {
        context.handledCircles.add(outerRing.entity)
      }
    }
    for (const ring of innerRings) {
      if ("points" in ring.entity) context.handledPaths.add(ring.entity)
      else context.handledCircles.add(ring.entity)
    }

    addRingDiagnostics({ context, ring: outerRing, copperPourId })
    for (const ring of innerRings) {
      addRingDiagnostics({ context, ring, copperPourId })
    }
  }
}
