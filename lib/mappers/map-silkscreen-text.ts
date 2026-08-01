import type { AnyCircuitElement, NinePointAnchor } from "circuit-json"
import type { PadsGeometryText } from "padsts"
import type { ConversionContext } from "../internal/conversion-context"
import {
  nanometersToMillimeters,
  toCircuitJsonPoint,
  toStableCircuitJsonId,
} from "../internal/coordinates"
import {
  createApproximationDiagnostic,
  createSkippedDiagnostic,
} from "../internal/diagnostics"

const getSilkscreenLayer = (
  text: PadsGeometryText,
): "top" | "bottom" | undefined =>
  text.gerberLayer === "F_Silkscreen"
    ? "top"
    : text.gerberLayer === "B_Silkscreen"
      ? "bottom"
      : undefined

const getAnchorAlignment = (text: PadsGeometryText): NinePointAnchor => {
  const horizontal = text.horizontalAlignment ?? "center"
  const vertical = text.verticalAlignment ?? "center"
  if (horizontal === "center" && vertical === "center") return "center"
  return `${vertical}_${horizontal}` as NinePointAnchor
}

export const mapSilkscreenText = (context: ConversionContext): void => {
  for (const [index, text] of context.geometry.texts.entries()) {
    const layer = getSilkscreenLayer(text)
    if (!layer || !text.reference) continue
    context.handledTexts.add(text)

    const componentId = context.componentIdByReference.get(text.reference)
    if (!componentId) {
      context.diagnostics.push(
        createSkippedDiagnostic({
          code: "circuit-json-silkscreen-text-component-unavailable",
          message:
            "Skipped component-owned silkscreen text because its decoded component was not emitted",
          entity: text,
          fallbackSource: context.documentSource,
        }),
      )
      continue
    }

    const silkscreenTextId = toStableCircuitJsonId(
      "pcb_silkscreen_text",
      text.source?.sourceId,
      index,
    )
    context.circuitJson.push({
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: silkscreenTextId,
      pcb_component_id: componentId,
      font: "tscircuit2024",
      font_size: nanometersToMillimeters(text.height),
      text: text.content,
      ccw_rotation: text.rotation,
      layer,
      is_mirrored: text.mirrored,
      anchor_position: toCircuitJsonPoint(text.location),
      anchor_alignment: getAnchorAlignment(text),
    } as AnyCircuitElement)
    context.mappedEntities.add(text)

    context.diagnostics.push(
      createApproximationDiagnostic({
        code: "circuit-json-silkscreen-text-font-approximated",
        message:
          "Substituted the PADS stroke font and stroke width with the Circuit JSON tscircuit2024 font while preserving component-owned text, height, alignment, rotation, mirroring, and layer",
        entity: text,
        circuitJsonIds: [silkscreenTextId],
        fallbackSource: context.documentSource,
      }),
    )
  }
}
