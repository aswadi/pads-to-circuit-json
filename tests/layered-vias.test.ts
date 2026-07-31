import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts multilayer via spans", async () => {
  const testCase = await loadTestCase("layered-vias")
  const vias = testCase.circuitJson.filter(
    (element) => element.type === "pcb_via",
  )

  expect(vias).toHaveLength(3)
  expect(vias.map((via) => via.layers)).toEqual([
    ["top", "inner1", "inner2", "bottom"],
    ["inner1", "inner2"],
    ["top", "inner1", "inner2", "bottom"],
  ])
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-via-pad-stack-approximated",
    ),
  ).toHaveLength(3)

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")
})
