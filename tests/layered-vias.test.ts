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
  expect(vias.every((via) => via.pcb_trace_id === undefined)).toBe(true)
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-via-pad-stack-approximated",
    ),
  ).toHaveLength(3)
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-via-net-association-not-represented",
    ),
  ).toHaveLength(3)

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const viaStacksZoomSvg = renderConversionComparison({
    ...testCase,
    boardViewBox: { x: 0.9, y: -1.1, width: 8.3, height: 8.3 },
  })
  await expect(viaStacksZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "via-stacks-zoom",
  )
})
