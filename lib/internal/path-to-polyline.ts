import type { PadsGeometryPath, PadsGeometryPoint } from "padsts"

const DEFAULT_MAX_ANGLE_STEP_DEGREES = 5

export const pathHasArcs = (path: PadsGeometryPath): boolean =>
  Boolean(path.segments?.some((segment) => segment.kind === "arc"))

export const pathToPolylinePoints = (
  path: PadsGeometryPath,
  maxAngleStepDegrees = DEFAULT_MAX_ANGLE_STEP_DEGREES,
): PadsGeometryPoint[] => {
  if (!path.segments?.length) return path.points

  const points: PadsGeometryPoint[] = []
  for (const [segmentIndex, segment] of path.segments.entries()) {
    if (segmentIndex === 0) points.push(segment.start)
    if (segment.kind === "line") {
      points.push(segment.end)
      continue
    }

    const stepCount = Math.max(
      1,
      Math.ceil(Math.abs(segment.deltaAngle) / maxAngleStepDegrees),
    )
    for (let step = 1; step <= stepCount; step++) {
      if (step === stepCount) {
        points.push(segment.end)
        continue
      }
      const angleDegrees =
        segment.startAngle + segment.deltaAngle * (step / stepCount)
      const angleRadians = (angleDegrees * Math.PI) / 180
      points.push({
        x: segment.center.x + segment.radius * Math.cos(angleRadians),
        y: segment.center.y + segment.radius * Math.sin(angleRadians),
      })
    }
  }
  return points
}
