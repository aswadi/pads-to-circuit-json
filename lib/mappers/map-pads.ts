import type { AnyCircuitElement } from "circuit-json"
import type { PadsGeometryPad } from "padsts"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import {
  createApproximationDiagnostic,
  createSkippedDiagnostic,
} from "../internal/diagnostics"
import { getCircuitJsonLayer } from "../internal/layers"

const getPadShape = (pad: PadsGeometryPad): Record<string, unknown> => {
  if (pad.shape === "circle") {
    return {
      shape: "circle",
      radius: nanometersToMillimeters(Math.min(pad.width, pad.height) / 2),
    }
  }
  if (pad.shape === "oval") {
    return {
      shape: pad.rotation === 0 ? "pill" : "rotated_pill",
      width: nanometersToMillimeters(pad.width),
      height: nanometersToMillimeters(pad.height),
      radius: nanometersToMillimeters(Math.min(pad.width, pad.height) / 2),
      ...(pad.rotation === 0 ? {} : { ccw_rotation: pad.rotation }),
    }
  }
  return {
    shape: pad.rotation === 0 ? "rect" : "rotated_rect",
    width: nanometersToMillimeters(pad.width),
    height: nanometersToMillimeters(pad.height),
    ...(pad.cornerRadius
      ? { rect_border_radius: nanometersToMillimeters(pad.cornerRadius) }
      : {}),
    ...(pad.rotation === 0 ? {} : { ccw_rotation: pad.rotation }),
  }
}

export const mapPads = (context: ConversionContext): void => {
  for (const [index, pad] of context.geometry.pads.entries()) {
    const layer = getCircuitJsonLayer(pad.layer, context.geometry.layerCount)
    if (!layer) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-pad-layer-unavailable",
          message: `Skipped ${pad.reference}.${pad.pinNumber} because PADS layer ${pad.layer} has no Circuit JSON layer mapping`,
          entity: pad,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const padId = toStableCircuitJsonId(
      "pcb_smtpad",
      pad.source?.sourceId,
      index,
    )
    context.circuitJson.push({
      type: "pcb_smtpad",
      pcb_smtpad_id: padId,
      pcb_component_id: context.componentIdByReference.get(pad.reference),
      x: nanometersToMillimeters(pad.center.x),
      y: nanometersToMillimeters(pad.center.y),
      layer,
      ...getPadShape(pad),
    } as AnyCircuitElement)

    if (pad.chamfered) {
      context.diagnostics.push(
        createApproximationDiagnostic({
          code: "circuit-json-pad-chamfer-approximated",
          message:
            "Mapped a chamfered PADS pad to its enclosing Circuit JSON rectangle",
          entity: pad,
          circuitJsonIds: [padId],
          fallbackSource: context.documentSource,
        }),
      )
    }
  }
}
