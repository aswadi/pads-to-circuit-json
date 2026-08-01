import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts the routed Dexter V2007.0 reference board", async () => {
  const testCase = await loadTestCase("dexter-motor-control")
  const elementsOfType = (type: string) =>
    testCase.circuitJson.filter((element) => element.type === type)

  expect(testCase.document).toMatchObject({
    kind: "ascii",
    version: "V2007.0",
    units: "BASIC",
  })
  expect(elementsOfType("pcb_board")).toHaveLength(1)
  expect(elementsOfType("source_component")).toHaveLength(251)
  expect(elementsOfType("pcb_component")).toHaveLength(251)
  expect(elementsOfType("source_net")).toHaveLength(222)
  expect(elementsOfType("pcb_net")).toHaveLength(222)
  expect(elementsOfType("source_port")).toHaveLength(918)
  expect(elementsOfType("pcb_port")).toHaveLength(918)
  expect(elementsOfType("source_trace")).toHaveLength(222)
  expect(elementsOfType("pcb_smtpad")).toHaveLength(828)
  expect(elementsOfType("pcb_plated_hole")).toHaveLength(90)
  expect(elementsOfType("pcb_hole")).toHaveLength(5)
  expect(elementsOfType("pcb_trace")).toHaveLength(2_850)
  expect(elementsOfType("pcb_via")).toHaveLength(796)
  expect(elementsOfType("pcb_keepout")).toHaveLength(29)
  expect(elementsOfType("pcb_silkscreen_text")).toHaveLength(490)
  expect(elementsOfType("pcb_silkscreen_text")).toContainEqual(
    expect.objectContaining({
      text: "C26",
      layer: "top",
      is_mirrored: false,
      ccw_rotation: 0,
      anchor_alignment: "top_left",
      pcb_component_id: expect.any(String),
    }),
  )
  expect(testCase.conversion.report.lossless).toBe(false)
  expect(testCase.conversion.report.mappingCoverage.sourceEntities.total).toBe(
    6_472,
  )
  expect(testCase.conversion.report.mappingCoverage.mappedEntities.total).toBe(
    6_038,
  )
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-silkscreen-text-font-approximated",
    ),
  ).toHaveLength(490)

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const throughHoleBankZoomSvg = renderConversionComparison({
    ...testCase,
    boardViewBox: { x: 4, y: 99, width: 10.5, height: 69 },
  })
  await expect(throughHoleBankZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "j7-through-hole-bank-zoom",
  )
}, 30_000)
