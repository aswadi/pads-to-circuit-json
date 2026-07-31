import { expect, test } from "bun:test"
import { convertPadsToCircuitJson } from "../lib"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts placed decals and compares both renderers", async () => {
  const testCase = await loadTestCase("placed-decals")
  const elementTypes = testCase.circuitJson.map(({ type }) => type)

  expect(elementTypes.filter((type) => type === "pcb_board")).toHaveLength(1)
  expect(elementTypes.filter((type) => type === "pcb_component")).toHaveLength(
    2,
  )
  expect(elementTypes.filter((type) => type === "pcb_smtpad")).toHaveLength(8)
  expect(testCase.conversion.report.lossless).toBe(false)
  expect(convertPadsToCircuitJson(testCase.bytes).circuitJson).toEqual(
    testCase.conversion.circuitJson,
  )
  expect(
    convertPadsToCircuitJson(new TextDecoder().decode(testCase.bytes))
      .circuitJson,
  ).toEqual(testCase.conversion.circuitJson)

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")
})
