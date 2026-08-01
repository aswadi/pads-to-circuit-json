import type { PadsBoardGeometry, PadsGeometryPath } from "padsts"
import { getPolygonArea } from "./polygon"
import { getTextBoundsPoints } from "./text-bounds"

export interface GeometryBounds {
  minimumX: number
  minimumY: number
  maximumX: number
  maximumY: number
}

export const getBoardOutline = (
  geometry: PadsBoardGeometry,
): PadsGeometryPath | undefined =>
  geometry.paths
    .filter(
      (path) =>
        path.kind === "outline" && path.closed && path.points.length >= 3,
    )
    .sort(
      (first, second) =>
        getPolygonArea(second.points) - getPolygonArea(first.points),
    )[0]

const includePoint = (
  boundsByReference: Map<string, GeometryBounds>,
  reference: string | undefined,
  x: number,
  y: number,
): void => {
  if (!reference || !Number.isFinite(x) || !Number.isFinite(y)) return
  const bounds = boundsByReference.get(reference)
  if (!bounds) {
    boundsByReference.set(reference, {
      minimumX: x,
      minimumY: y,
      maximumX: x,
      maximumY: y,
    })
    return
  }
  bounds.minimumX = Math.min(bounds.minimumX, x)
  bounds.minimumY = Math.min(bounds.minimumY, y)
  bounds.maximumX = Math.max(bounds.maximumX, x)
  bounds.maximumY = Math.max(bounds.maximumY, y)
}

export const getComponentBoundsByReference = (
  geometry: PadsBoardGeometry,
): Map<string, GeometryBounds> => {
  const boundsByReference = new Map<string, GeometryBounds>()
  for (const pad of geometry.pads) {
    includePoint(
      boundsByReference,
      pad.reference,
      pad.center.x - pad.width / 2,
      pad.center.y - pad.height / 2,
    )
    includePoint(
      boundsByReference,
      pad.reference,
      pad.center.x + pad.width / 2,
      pad.center.y + pad.height / 2,
    )
  }
  for (const hole of geometry.holes) {
    includePoint(
      boundsByReference,
      hole.reference,
      hole.center.x - hole.width / 2,
      hole.center.y - hole.height / 2,
    )
    includePoint(
      boundsByReference,
      hole.reference,
      hole.center.x + hole.width / 2,
      hole.center.y + hole.height / 2,
    )
  }
  for (const path of geometry.paths) {
    for (const point of path.points) {
      includePoint(boundsByReference, path.reference, point.x, point.y)
    }
  }
  for (const circle of geometry.circles) {
    includePoint(
      boundsByReference,
      circle.reference,
      circle.center.x - circle.radius,
      circle.center.y - circle.radius,
    )
    includePoint(
      boundsByReference,
      circle.reference,
      circle.center.x + circle.radius,
      circle.center.y + circle.radius,
    )
  }
  for (const text of geometry.texts) {
    if (text.role) continue
    for (const point of getTextBoundsPoints(text)) {
      includePoint(boundsByReference, text.reference, point.x, point.y)
    }
  }
  return boundsByReference
}

export const getComponentBounds = (
  geometry: PadsBoardGeometry,
  reference: string,
): GeometryBounds | undefined =>
  getComponentBoundsByReference(geometry).get(reference)
