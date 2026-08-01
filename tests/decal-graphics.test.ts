import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts supported decal graphics and reports unsupported artwork", async () => {
  const testCase = await loadTestCase("decal-graphics")
  const elementTypes = testCase.circuitJson.map(({ type }) => type)
  const diagnosticCodes = testCase.conversion.report.diagnostics.map(
    ({ code }) => code,
  )

  expect(elementTypes.filter((type) => type === "pcb_component")).toHaveLength(
    2,
  )
  expect(elementTypes.filter((type) => type === "pcb_smtpad")).toHaveLength(2)
  expect(
    elementTypes.filter((type) => type === "pcb_copper_pour"),
  ).toHaveLength(2)
  expect(elementTypes.filter((type) => type === "pcb_keepout")).toHaveLength(4)
  expect(
    elementTypes.filter((type) => type === "pcb_silkscreen_circle"),
  ).toHaveLength(2)
  expect(
    elementTypes.filter((type) => type === "pcb_fabrication_note_path"),
  ).toHaveLength(2)
  expect(diagnosticCodes).toContain("circuit-json-silkscreen-arcs-segmented")
  expect(diagnosticCodes).toContain(
    "circuit-json-keepout-restrictions-approximated",
  )

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const featureZoomSvg = renderConversionComparison({
    ...testCase,
    boardViewBox: { x: 1.8, y: 1.8, width: 4, height: 4 },
  })
  await expect(featureZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "feature-zoom",
  )
})
