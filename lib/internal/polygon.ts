import type { PadsGeometryPoint } from "padsts"

const COORDINATE_EPSILON = 1e-6

export const pointsAreEqual = (
  first: PadsGeometryPoint,
  second: PadsGeometryPoint,
): boolean =>
  Math.abs(first.x - second.x) <= COORDINATE_EPSILON &&
  Math.abs(first.y - second.y) <= COORDINATE_EPSILON

export const withoutRepeatedClosingPoint = (
  points: PadsGeometryPoint[],
): PadsGeometryPoint[] =>
  points.length > 1 && pointsAreEqual(points[0]!, points.at(-1)!)
    ? points.slice(0, -1)
    : points

export const getPolygonArea = (points: PadsGeometryPoint[]): number => {
  const ring = withoutRepeatedClosingPoint(points)
  return Math.abs(
    ring.reduce((area, point, index) => {
      const nextPoint = ring[(index + 1) % ring.length]
      return nextPoint
        ? area + point.x * nextPoint.y - nextPoint.x * point.y
        : area
    }, 0) / 2,
  )
}

export const polygonContainsPoint = (
  polygon: PadsGeometryPoint[],
  point: PadsGeometryPoint,
): boolean => {
  const ring = withoutRepeatedClosingPoint(polygon)
  let inside = false
  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index++
  ) {
    const start = ring[index]!
    const end = ring[previous]!
    const crossesRay =
      start.y > point.y !== end.y > point.y &&
      point.x <
        ((end.x - start.x) * (point.y - start.y)) / (end.y - start.y) + start.x
    if (crossesRay) inside = !inside
  }
  return inside
}

export const polygonContainsPolygon = (
  outer: PadsGeometryPoint[],
  inner: PadsGeometryPoint[],
): boolean =>
  withoutRepeatedClosingPoint(inner).every((point) =>
    polygonContainsPoint(outer, point),
  )

export const circleToPolylinePoints = ({
  center,
  radius,
  maximumAngleDegrees = 5,
}: {
  center: PadsGeometryPoint
  radius: number
  maximumAngleDegrees?: number
}): PadsGeometryPoint[] => {
  const segmentCount = Math.ceil(360 / maximumAngleDegrees)
  return Array.from({ length: segmentCount }, (_, index) => {
    const angle = (index / segmentCount) * Math.PI * 2
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    }
  })
}

export const getAxisAlignedRectangle = (
  points: PadsGeometryPoint[],
): { center: PadsGeometryPoint; width: number; height: number } | undefined => {
  const ring = withoutRepeatedClosingPoint(points)
  if (ring.length !== 4) return undefined
  const minimumX = Math.min(...ring.map(({ x }) => x))
  const maximumX = Math.max(...ring.map(({ x }) => x))
  const minimumY = Math.min(...ring.map(({ y }) => y))
  const maximumY = Math.max(...ring.map(({ y }) => y))
  if (minimumX === maximumX || minimumY === maximumY) return undefined

  const expectedCorners = [
    { x: minimumX, y: minimumY },
    { x: maximumX, y: minimumY },
    { x: maximumX, y: maximumY },
    { x: minimumX, y: maximumY },
  ]
  if (
    !expectedCorners.every((corner) =>
      ring.some((point) => pointsAreEqual(point, corner)),
    )
  ) {
    return undefined
  }

  return {
    center: { x: (minimumX + maximumX) / 2, y: (minimumY + maximumY) / 2 },
    width: maximumX - minimumX,
    height: maximumY - minimumY,
  }
}
