import type {
  PadsBoardGeometry,
  PadsGeometryPath,
  PadsGeometryPoint,
} from "padsts"

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
    .sort((first, second) => second.points.length - first.points.length)[0]

const getComponentPoints = (
  geometry: PadsBoardGeometry,
  reference: string,
): PadsGeometryPoint[] => [
  ...geometry.pads
    .filter((pad) => pad.reference === reference)
    .flatMap((pad) => [
      { x: pad.center.x - pad.width / 2, y: pad.center.y - pad.height / 2 },
      { x: pad.center.x + pad.width / 2, y: pad.center.y + pad.height / 2 },
    ]),
  ...geometry.holes
    .filter((hole) => hole.reference === reference)
    .flatMap((hole) => [
      {
        x: hole.center.x - hole.width / 2,
        y: hole.center.y - hole.height / 2,
      },
      {
        x: hole.center.x + hole.width / 2,
        y: hole.center.y + hole.height / 2,
      },
    ]),
  ...geometry.paths
    .filter((path) => path.reference === reference)
    .flatMap((path) => path.points),
  ...geometry.circles
    .filter((circle) => circle.reference === reference)
    .flatMap((circle) => [
      {
        x: circle.center.x - circle.radius,
        y: circle.center.y - circle.radius,
      },
      {
        x: circle.center.x + circle.radius,
        y: circle.center.y + circle.radius,
      },
    ]),
]

export const getComponentBounds = (
  geometry: PadsBoardGeometry,
  reference: string,
): GeometryBounds | undefined => {
  const points = getComponentPoints(geometry, reference).filter(
    ({ x, y }) => Number.isFinite(x) && Number.isFinite(y),
  )
  if (points.length === 0) return undefined
  return {
    minimumX: Math.min(...points.map(({ x }) => x)),
    minimumY: Math.min(...points.map(({ y }) => y)),
    maximumX: Math.max(...points.map(({ x }) => x)),
    maximumY: Math.max(...points.map(({ y }) => y)),
  }
}
