import type { PadsGeometryHole, PadsGeometryPad } from "padsts"
import { nanometersToMillimeters } from "./coordinates"

const rotatePoint = (
  point: { x: number; y: number },
  rotation: number,
): { x: number; y: number } => {
  const radians = (rotation * Math.PI) / 180
  return {
    x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
    y: point.x * Math.sin(radians) + point.y * Math.cos(radians),
  }
}

const getChamferedOutline = (pad: PadsGeometryPad) => {
  const halfWidth = pad.width / 2
  const halfHeight = pad.height / 2
  const corner = Math.min(
    Math.abs(pad.cornerRadius ?? 0),
    halfWidth,
    halfHeight,
  )
  return [
    { x: -halfWidth + corner, y: -halfHeight },
    { x: halfWidth - corner, y: -halfHeight },
    { x: halfWidth, y: -halfHeight + corner },
    { x: halfWidth, y: halfHeight - corner },
    { x: halfWidth - corner, y: halfHeight },
    { x: -halfWidth + corner, y: halfHeight },
    { x: -halfWidth, y: halfHeight - corner },
    { x: -halfWidth, y: -halfHeight + corner },
  ]
}

const getEllipseOutline = (pad: PadsGeometryPad) =>
  Array.from({ length: 72 }, (_, index) => {
    const radians = (index * Math.PI * 2) / 72
    return {
      x: (pad.width / 2) * Math.cos(radians),
      y: (pad.height / 2) * Math.sin(radians),
    }
  })

const getPadOutline = (pad: PadsGeometryPad) => {
  const points = pad.chamfered
    ? getChamferedOutline(pad)
    : pad.shape === "circle" || pad.shape === "oval"
      ? getEllipseOutline(pad)
      : [
          { x: -pad.width / 2, y: -pad.height / 2 },
          { x: pad.width / 2, y: -pad.height / 2 },
          { x: pad.width / 2, y: pad.height / 2 },
          { x: -pad.width / 2, y: pad.height / 2 },
        ]
  return points.map((point) => {
    const rotated = rotatePoint(point, pad.rotation)
    return {
      x: nanometersToMillimeters(rotated.x),
      y: nanometersToMillimeters(rotated.y),
    }
  })
}

const getHoleOffset = (hole: PadsGeometryHole, pad: PadsGeometryPad) => ({
  hole_offset_x: nanometersToMillimeters(hole.center.x - pad.center.x),
  hole_offset_y: nanometersToMillimeters(hole.center.y - pad.center.y),
})

const isCircular = ({ width, height }: { width: number; height: number }) =>
  Math.abs(width - height) < 1e-6

export const getPlatedHoleShape = ({
  hole,
  pad,
}: {
  hole: PadsGeometryHole
  pad?: PadsGeometryPad
}): Record<string, unknown> => {
  const holeIsCircular = isCircular(hole)
  if (!pad) {
    return holeIsCircular
      ? {
          shape: "circle",
          x: nanometersToMillimeters(hole.center.x),
          y: nanometersToMillimeters(hole.center.y),
          hole_diameter: nanometersToMillimeters(hole.width),
          outer_diameter: nanometersToMillimeters(hole.width),
        }
      : {
          shape: "oval",
          x: nanometersToMillimeters(hole.center.x),
          y: nanometersToMillimeters(hole.center.y),
          hole_width: nanometersToMillimeters(hole.width),
          hole_height: nanometersToMillimeters(hole.height),
          outer_width: nanometersToMillimeters(hole.width),
          outer_height: nanometersToMillimeters(hole.height),
          ccw_rotation: hole.rotation,
        }
  }

  const center = {
    x: nanometersToMillimeters(pad.center.x),
    y: nanometersToMillimeters(pad.center.y),
  }
  const offset = getHoleOffset(hole, pad)
  const centersMatch =
    Math.abs(offset.hole_offset_x) < 1e-9 &&
    Math.abs(offset.hole_offset_y) < 1e-9

  if (holeIsCircular && pad.shape === "circle" && centersMatch) {
    return {
      ...center,
      shape: "circle",
      hole_diameter: nanometersToMillimeters(hole.width),
      outer_diameter: nanometersToMillimeters(Math.min(pad.width, pad.height)),
    }
  }

  const normalizedRotationDelta =
    (((hole.rotation - pad.rotation) % 180) + 180) % 180
  const rotationDelta = Math.min(
    normalizedRotationDelta,
    180 - normalizedRotationDelta,
  )
  if (pad.shape === "oval" && centersMatch && rotationDelta < 1e-6) {
    return {
      ...center,
      shape: "pill",
      hole_width: nanometersToMillimeters(hole.width),
      hole_height: nanometersToMillimeters(hole.height),
      outer_width: nanometersToMillimeters(pad.width),
      outer_height: nanometersToMillimeters(pad.height),
      ccw_rotation: pad.rotation,
    }
  }

  if (!pad.chamfered && (pad.shape === "rect" || pad.shape === "square")) {
    const rectangle = {
      ...center,
      ...offset,
      pad_shape: "rect",
      rect_pad_width: nanometersToMillimeters(pad.width),
      rect_pad_height: nanometersToMillimeters(pad.height),
      ...(pad.cornerRadius
        ? {
            rect_border_radius: nanometersToMillimeters(pad.cornerRadius),
          }
        : {}),
    }
    return holeIsCircular
      ? {
          ...rectangle,
          shape: "circular_hole_with_rect_pad",
          hole_shape: "circle",
          hole_diameter: nanometersToMillimeters(hole.width),
          ...(pad.rotation ? { rect_ccw_rotation: pad.rotation } : {}),
        }
      : {
          ...rectangle,
          shape: "rotated_pill_hole_with_rect_pad",
          hole_shape: "rotated_pill",
          hole_width: nanometersToMillimeters(hole.width),
          hole_height: nanometersToMillimeters(hole.height),
          hole_ccw_rotation: hole.rotation,
          rect_ccw_rotation: pad.rotation,
        }
  }

  return {
    ...center,
    ...offset,
    shape: "hole_with_polygon_pad",
    hole_shape: holeIsCircular ? "circle" : "rotated_pill",
    ...(holeIsCircular
      ? { hole_diameter: nanometersToMillimeters(hole.width) }
      : {
          hole_width: nanometersToMillimeters(hole.width),
          hole_height: nanometersToMillimeters(hole.height),
          ccw_rotation: hole.rotation,
        }),
    pad_outline: getPadOutline(pad),
  }
}
