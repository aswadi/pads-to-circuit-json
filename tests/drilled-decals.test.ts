import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts plated and non-plated drilled decals", async () => {
  const testCase = await loadTestCase("drilled-decals")
  const elementsOfType = (type: string) =>
    testCase.circuitJson.filter((element) => element.type === type)

  expect(elementsOfType("pcb_board")).toHaveLength(1)
  expect(elementsOfType("pcb_component")).toHaveLength(2)
  expect(elementsOfType("pcb_smtpad")).toHaveLength(8)
  expect(elementsOfType("pcb_plated_hole")).toHaveLength(4)
  expect(elementsOfType("pcb_hole")).toHaveLength(4)
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-pad-chamfer-approximated",
    ),
  ).toHaveLength(2)

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")
})
