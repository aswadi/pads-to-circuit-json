import { expect, test } from "bun:test"
import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import { parsePads } from "padsts"
import { convertPadsToCircuitJson } from "../lib"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts top and bottom component labels", async () => {
  const fixturePath = new URL(
    "./fixtures/component-labels.asc",
    import.meta.url,
  )
  const document = parsePads(await Bun.file(fixturePath).bytes())
  const conversion = convertPadsToCircuitJson(document)
  const circuitJson = conversion.circuitJson.map((element, index) => {
    const result = any_circuit_element.safeParse(element)
    if (!result.success) {
      throw new Error(
        `Component label element ${index} failed Circuit JSON validation: ${result.error.message}`,
      )
    }
    return result.data as AnyCircuitElement
  })
  const labels = circuitJson.filter(
    (element) => element.type === "pcb_silkscreen_text",
  )

  expect(labels).toHaveLength(4)
  expect(labels).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        text: "U1",
        layer: "top",
        ccw_rotation: 45,
        is_mirrored: false,
        anchor_alignment: "top_left",
      }),
      expect.objectContaining({
        text: "LABEL_TYPE",
        layer: "top",
        ccw_rotation: 45,
        is_mirrored: false,
        anchor_alignment: "bottom_right",
      }),
      expect.objectContaining({
        text: "U2",
        layer: "bottom",
        ccw_rotation: 135,
        is_mirrored: true,
        anchor_alignment: "top_left",
      }),
      expect.objectContaining({
        text: "LABEL_TYPE",
        layer: "bottom",
        ccw_rotation: 135,
        is_mirrored: false,
        anchor_alignment: "bottom_right",
      }),
    ]),
  )
  expect(
    conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-silkscreen-text-font-approximated",
    ),
  ).toHaveLength(4)
  expect(conversion.report.diagnostics).not.toContainEqual(
    expect.objectContaining({ code: "circuit-json-text-not-represented" }),
  )

  const comparisonSvg = renderConversionComparison({ document, circuitJson })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const topLabelZoomSvg = renderConversionComparison({
    document,
    circuitJson: circuitJson.filter(
      (element) =>
        element.type === "pcb_board" ||
        (element.type === "pcb_silkscreen_text" && element.layer === "top"),
    ),
    padsOptions: {
      visibleGerberLayers: ["F_Silkscreen", "Edge_Cuts"],
      visibleTextReferences: ["U1"],
    },
    boardViewBox: { x: 0, y: 0, width: 12.7, height: 15.24 },
  })
  await expect(topLabelZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "top-label-zoom",
  )

  const bottomLabelZoomSvg = renderConversionComparison({
    document,
    circuitJson: circuitJson.filter(
      (element) =>
        element.type === "pcb_board" ||
        (element.type === "pcb_silkscreen_text" && element.layer === "bottom"),
    ),
    padsOptions: {
      visibleGerberLayers: ["B_Silkscreen", "Edge_Cuts"],
      visibleTextReferences: ["U2"],
    },
    boardViewBox: { x: 12.7, y: 0, width: 12.7, height: 15.24 },
  })
  await expect(bottomLabelZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "bottom-label-zoom",
  )
})
