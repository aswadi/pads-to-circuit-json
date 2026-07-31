import { expect, test } from "bun:test"
import { convertPadsToCircuitJson } from "../lib"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("reports compound copper cutouts that are not yet converted", async () => {
  const testCase = await loadTestCase("copper-cutouts")
  const skippedCopper = testCase.conversion.report.diagnostics.filter(
    ({ code }) => code === "circuit-json-copper-path-not-represented",
  )
  const skippedCircles = testCase.conversion.report.diagnostics.filter(
    ({ code }) => code === "circuit-json-circle-not-represented",
  )

  expect(skippedCopper).toHaveLength(4)
  expect(skippedCircles).toHaveLength(2)
  expect(testCase.conversion.report.lossless).toBe(false)
  const strictResult = convertPadsToCircuitJson(testCase.document, {
    strict: true,
  })
  expect(strictResult.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "strict-circuit-json-conversion-would-be-lossy",
      severity: "error",
    }),
  )
  expect(JSON.parse(JSON.stringify(strictResult.report))).toEqual(
    strictResult.report,
  )

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")
})
