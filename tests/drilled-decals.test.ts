import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts plated and non-plated drilled decals", async () => {
  const testCase = await loadTestCase("drilled-decals")
  const elementsOfType = (type: string) =>
    testCase.circuitJson.filter((element) => element.type === type)

  expect(elementsOfType("pcb_board")).toHaveLength(1)
  expect(elementsOfType("pcb_component")).toHaveLength(2)
  expect(elementsOfType("pcb_smtpad")).toHaveLength(4)
  expect(elementsOfType("pcb_plated_hole")).toHaveLength(4)
  expect(elementsOfType("pcb_hole")).toHaveLength(4)
  const pads = testCase.circuitJson.filter(
    (element) => element.type === "pcb_smtpad",
  )
  expect(
    pads.filter((pad) => pad.shape === "rect" || pad.shape === "rotated_rect"),
  ).toHaveLength(2)
  expect(
    pads.filter((pad) => pad.shape === "pill" || pad.shape === "rotated_pill"),
  ).toHaveLength(2)
  const platedHoles = testCase.circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  )
  expect(
    platedHoles.filter(
      (hole) =>
        hole.shape === "circle" &&
        hole.outer_diameter === 0.9144 &&
        hole.hole_diameter === 0.4572,
    ),
  ).toHaveLength(2)
  const polygonPlatedHoles = platedHoles.filter(
    (hole) => hole.shape === "hole_with_polygon_pad",
  )
  expect(polygonPlatedHoles).toHaveLength(2)
  expect(
    polygonPlatedHoles.every(
      (hole) =>
        hole.pad_outline.length === 8 &&
        (hole.hole_offset_x !== 0 || hole.hole_offset_y !== 0),
    ),
  ).toBe(true)
  expect(pads.filter((pad) => pad.layer === "top")).toHaveLength(2)
  expect(pads.filter((pad) => pad.layer === "bottom")).toHaveLength(2)
  expect(testCase.conversion.report.mappingCoverage.sourceEntities.pads).toBe(8)
  expect(testCase.conversion.report.mappingCoverage.mappedEntities.pads).toBe(8)
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-pad-chamfer-approximated",
    ),
  ).toHaveLength(0)

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const slotsZoomSvg = renderConversionComparison({
    ...testCase,
    boardViewBox: { x: 1.3, y: 1.4, width: 5.2, height: 5.2 },
  })
  await expect(slotsZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "holes-and-slots-zoom",
  )
})
