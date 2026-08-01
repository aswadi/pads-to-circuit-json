import type { PadsGeometryPoint, PadsGeometryText } from "padsts"

export const getTextBoundsPoints = (
  text: PadsGeometryText,
): PadsGeometryPoint[] => {
  const width = Math.max(
    text.strokeWidth,
    text.height * Math.max(1, [...text.content].length) * 0.6,
  )
  const minimumX =
    text.horizontalAlignment === "left"
      ? 0
      : text.horizontalAlignment === "right"
        ? -width
        : -width / 2
  const minimumY =
    text.verticalAlignment === "top"
      ? -text.height
      : text.verticalAlignment === "bottom"
        ? 0
        : -text.height / 2
  const rotationRadians = (text.rotation * Math.PI) / 180
  const cosine = Math.cos(rotationRadians)
  const sine = Math.sin(rotationRadians)

  return [
    { x: minimumX, y: minimumY },
    { x: minimumX + width, y: minimumY },
    { x: minimumX + width, y: minimumY + text.height },
    { x: minimumX, y: minimumY + text.height },
  ].map(({ x, y }) => ({
    x: text.location.x + x * cosine - y * sine,
    y: text.location.y + x * sine + y * cosine,
  }))
}
