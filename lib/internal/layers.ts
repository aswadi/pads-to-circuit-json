import type {
  PadsBoardGeometry,
  PadsGeometryCircle,
  PadsGeometryPath,
} from "padsts"

export type CircuitJsonLayer =
  | "top"
  | "bottom"
  | `inner${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`

export const layerWasDefaultedToTop = ({
  gerberLayer,
  layer,
}: Pick<PadsGeometryPath | PadsGeometryCircle, "gerberLayer" | "layer">) =>
  !gerberLayer && Number.isFinite(Number(layer)) && Number(layer) <= 0

export const getCircuitJsonLayer = (
  layer: number | string | undefined,
  layerCount: number,
): CircuitJsonLayer | undefined => {
  const numericLayer = Number(layer)
  if (!Number.isFinite(numericLayer)) return undefined
  const normalizedLayer = Math.trunc(numericLayer)
  if (normalizedLayer <= 1) return "top"
  if (normalizedLayer >= layerCount) return "bottom"
  const innerLayer = normalizedLayer - 1
  return innerLayer >= 1 && innerLayer <= 8
    ? (`inner${innerLayer}` as CircuitJsonLayer)
    : undefined
}

export const getPathCircuitJsonLayer = (
  path: PadsGeometryPath,
  geometry: PadsBoardGeometry,
): CircuitJsonLayer | undefined => {
  if (path.gerberLayer === "F_Cu" || path.gerberLayer === "F_Silkscreen") {
    return "top"
  }
  if (path.gerberLayer === "B_Cu" || path.gerberLayer === "B_Silkscreen") {
    return "bottom"
  }
  const internalMatch = /^In([1-8])_Cu$/u.exec(path.gerberLayer ?? "")
  if (internalMatch?.[1]) {
    return `inner${Number(internalMatch[1])}` as CircuitJsonLayer
  }
  return getCircuitJsonLayer(path.layer, geometry.layerCount)
}

export const getCopperCircuitJsonLayer = (
  entity: Pick<PadsGeometryPath | PadsGeometryCircle, "gerberLayer" | "layer">,
  geometry: PadsBoardGeometry,
): CircuitJsonLayer | undefined => {
  const gerberLayer = entity.gerberLayer
  if (gerberLayer === "F_Cu") return "top"
  if (gerberLayer === "B_Cu") return "bottom"
  const internalMatch = /^In([1-8])_Cu$/u.exec(gerberLayer ?? "")
  if (internalMatch?.[1]) {
    return `inner${Number(internalMatch[1])}` as CircuitJsonLayer
  }
  if (gerberLayer) return undefined

  const numericLayer = Number(entity.layer)
  const layerInfo = geometry.layers.find(
    ({ number }) => number === Math.trunc(numericLayer),
  )
  if (layerInfo && layerInfo.role !== "copper") return undefined
  return getCircuitJsonLayer(entity.layer, geometry.layerCount)
}

export const getLayerSpan = (
  startLayer: number,
  endLayer: number,
  layerCount: number,
): CircuitJsonLayer[] =>
  Array.from({ length: Math.max(0, endLayer - startLayer + 1) }, (_, offset) =>
    getCircuitJsonLayer(startLayer + offset, layerCount),
  ).filter((layer): layer is CircuitJsonLayer => layer !== undefined)
