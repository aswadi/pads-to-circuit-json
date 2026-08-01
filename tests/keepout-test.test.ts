import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts board-level PADS keepout variants", async () => {
  const testCase = await loadTestCase("keepout-test")
  const keepouts = testCase.circuitJson.filter(
    (element) => element.type === "pcb_keepout",
  )

  expect(keepouts).toHaveLength(5)
  expect(keepouts.map((keepout) => keepout.description).sort()).toEqual([
    "AREA_RESTRICT",
    "KEEPOUT_RECT",
    "PLACEMENT_KO",
    "ROUTE_RESTRICT",
    "VIA_RESTRICT",
  ])
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) =>
        code === "circuit-json-keepout-restriction-scope-unavailable",
    ),
  ).toHaveLength(5)
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-keepout-layer-defaulted-to-top",
    ),
  ).toHaveLength(5)

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const keepoutsOnlySvg = renderConversionComparison({
    ...testCase,
    circuitJson: testCase.circuitJson.filter(
      ({ type }) => type === "pcb_board" || type === "pcb_keepout",
    ),
    padsOptions: { visibleGerberLayers: ["Keepout", "Edge_Cuts"] },
  })
  await expect(keepoutsOnlySvg).toMatchSvgSnapshot(
    import.meta.path,
    "keepouts-only",
  )
})
