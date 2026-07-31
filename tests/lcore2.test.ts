import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts the routed LCORE2 reference board", async () => {
  const testCase = await loadTestCase("lcore2")
  const elementsOfType = (type: string) =>
    testCase.circuitJson.filter((element) => element.type === type)

  expect(elementsOfType("pcb_board")).toHaveLength(1)
  expect(elementsOfType("pcb_component")).toHaveLength(30)
  expect(elementsOfType("pcb_smtpad")).toHaveLength(69)
  expect(elementsOfType("pcb_hole")).toHaveLength(4)
  expect(elementsOfType("pcb_trace")).toHaveLength(229)
  expect(elementsOfType("pcb_via")).toHaveLength(24)
  expect(testCase.conversion.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "circuit-json-board-arcs-segmented",
      severity: "warning",
    }),
  )

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")
})
