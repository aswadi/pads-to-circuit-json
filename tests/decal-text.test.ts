import { expect, test } from "bun:test"
import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import { parsePads } from "padsts"
import { convertPadsToCircuitJson } from "../lib"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

const fixtureUrl = new URL("./fixtures/decal-text.asc", import.meta.url)
const document = parsePads(await Bun.file(fixtureUrl).bytes())

test("converts static part-decal text as component-owned silkscreen", async () => {
  const conversion = convertPadsToCircuitJson(document)
  const circuitJson = conversion.circuitJson.map((element, index) => {
    const result = any_circuit_element.safeParse(element)
    if (!result.success) {
      throw new Error(
        `Part-decal text element ${index} failed Circuit JSON validation: ${result.error.message}`,
      )
    }
    return result.data as AnyCircuitElement
  })
  const texts = circuitJson.filter(
    (element) => element.type === "pcb_silkscreen_text",
  )

  expect(texts).toHaveLength(4)
  expect(texts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        text: "PIN 1",
        layer: "top",
        ccw_rotation: 20,
        is_mirrored: false,
        anchor_alignment: "top_left",
      }),
      expect.objectContaining({
        text: "POL +",
        layer: "top",
        ccw_rotation: 110,
        is_mirrored: true,
        anchor_alignment: "bottom_right",
      }),
      expect.objectContaining({
        text: "PIN 1",
        layer: "bottom",
        ccw_rotation: 160,
        is_mirrored: true,
        anchor_alignment: "top_left",
      }),
      expect.objectContaining({
        text: "POL +",
        layer: "bottom",
        ccw_rotation: 70,
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

  for (const view of [
    {
      name: "top-text-zoom",
      reference: "U1",
      layer: "top",
      gerberLayer: "F_Silkscreen",
      boardViewBox: { x: 0, y: -1, width: 8, height: 10 },
    },
    {
      name: "bottom-text-zoom",
      reference: "U2",
      layer: "bottom",
      gerberLayer: "B_Silkscreen",
      boardViewBox: { x: 0, y: -2, width: 15, height: 12 },
    },
  ] as const) {
    const zoomSvg = renderConversionComparison({
      document,
      circuitJson: circuitJson.filter(
        (element) =>
          element.type === "pcb_board" ||
          (element.type === "pcb_silkscreen_text" &&
            element.layer === view.layer),
      ),
      padsOptions: {
        visibleGerberLayers: [view.gerberLayer, "Edge_Cuts"],
        visibleTextReferences: [view.reference],
      },
      boardViewBox: view.boardViewBox,
    })
    await expect(zoomSvg).toMatchSvgSnapshot(import.meta.path, view.name)
  }
})
