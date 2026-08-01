import { expect, test } from "bun:test"
import { convertPadsToCircuitJson } from "../lib"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts compound copper regions and their cutouts", async () => {
  const testCase = await loadTestCase("copper-cutouts")
  const copperPours = testCase.circuitJson.filter(
    ({ type }) => type === "pcb_copper_pour",
  )

  expect(copperPours).toHaveLength(2)
  expect(copperPours).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        shape: "brep",
        layer: "top",
        brep_shape: expect.objectContaining({
          inner_rings: expect.arrayContaining([
            expect.objectContaining({ vertices: expect.any(Array) }),
          ]),
        }),
      }),
      expect.objectContaining({ shape: "brep", layer: "bottom" }),
    ]),
  )
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-copper-curves-segmented",
    ),
  ).toHaveLength(2)
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

  const cutoutZoomSvg = renderConversionComparison({
    ...testCase,
    boardViewBox: { x: 1.5, y: 0.8, width: 5.9, height: 5.9 },
  })
  await expect(cutoutZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "cutout-zoom",
  )
})
