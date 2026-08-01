import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts the synthetic 12-layer PADS board", async () => {
  const testCase = await loadTestCase("synthetic-multilayer")
  const elementsOfType = (type: string) =>
    testCase.circuitJson.filter((element) => element.type === type)

  expect(elementsOfType("pcb_board")).toContainEqual(
    expect.objectContaining({ num_layers: 12 }),
  )
  expect(elementsOfType("pcb_copper_pour")).toHaveLength(2)
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-copper-layer-defaulted-to-top",
    ),
  ).toHaveLength(2)
  expect(testCase.conversion.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "circuit-json-layer-stack-partially-named",
      category: "approximate",
    }),
  )
  expect(testCase.conversion.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "geometry-ascii-via-instances-reference-missing-pad-stack",
      category: "malformed",
    }),
  )
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-unverified-via-not-represented",
    ),
  ).toHaveLength(3)

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")
})
