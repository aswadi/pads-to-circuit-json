import type { PadsGeometryPoint } from "padsts"

export const nanometersToMillimeters = (value: number): number =>
  value / 1_000_000

export const toCircuitJsonPoint = ({ x, y }: PadsGeometryPoint) => ({
  x: nanometersToMillimeters(x),
  y: nanometersToMillimeters(y),
})

export const toStableCircuitJsonId = (
  prefix: string,
  sourceId: string | undefined,
  fallbackIndex: number,
): string =>
  `${prefix}_${(sourceId ?? "generated").replace(/[^A-Za-z0-9_]+/gu, "_")}_${fallbackIndex}`
