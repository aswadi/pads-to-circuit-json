import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts the ClaySight board and its eight circular cutouts", async () => {
  const testCase = await loadTestCase("claysight")
  const elementsOfType = (type: string) =>
    testCase.circuitJson.filter((element) => element.type === type)
  const cutouts = elementsOfType("pcb_cutout")
  const platedHoles = testCase.circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  )
  const board = elementsOfType("pcb_board")[0]
  const boardId =
    board && "pcb_board_id" in board ? board.pcb_board_id : undefined

  expect(elementsOfType("pcb_board")).toHaveLength(1)
  expect(elementsOfType("pcb_component")).toHaveLength(36)
  expect(elementsOfType("source_port")).toHaveLength(140)
  expect(elementsOfType("pcb_port")).toHaveLength(140)
  expect(elementsOfType("source_trace")).toHaveLength(32)
  expect(elementsOfType("pcb_smtpad")).toHaveLength(0)
  expect(platedHoles).toHaveLength(140)
  expect(elementsOfType("pcb_trace")).toHaveLength(245)
  expect(elementsOfType("pcb_silkscreen_text")).toHaveLength(8)
  expect(elementsOfType("pcb_silkscreen_text")).toContainEqual(
    expect.objectContaining({
      text: "M1",
      layer: "top",
      is_mirrored: false,
      anchor_alignment: "top_left",
      pcb_component_id: expect.any(String),
    }),
  )
  expect(
    platedHoles.every(
      (hole) => "pcb_port_id" in hole && typeof hole.pcb_port_id === "string",
    ),
  ).toBe(true)
  expect(
    platedHoles.filter(
      (hole) =>
        hole.shape === "circle" && hole.outer_diameter > hole.hole_diameter,
    ),
  ).toHaveLength(115)
  expect(
    platedHoles.filter(
      (hole) =>
        hole.shape === "circular_hole_with_rect_pad" ||
        hole.shape === "pill" ||
        hole.shape === "hole_with_polygon_pad",
    ),
  ).toHaveLength(25)
  expect(testCase.conversion.report.mappingCoverage.sourceEntities.pads).toBe(
    140,
  )
  expect(testCase.conversion.report.mappingCoverage.mappedEntities.pads).toBe(
    140,
  )
  expect(cutouts).toHaveLength(8)
  expect(cutouts).toContainEqual(
    expect.objectContaining({
      shape: "circle",
      center: { x: 85.59800033333333, y: 136.652 },
      radius: 1.499997,
    }),
  )
  expect(
    cutouts.every(
      (cutout) => "pcb_board_id" in cutout && cutout.pcb_board_id === boardId,
    ),
  ).toBe(true)
  expect(testCase.conversion.report.mappingCoverage.sections.LINES).toEqual({
    sourceEntityCount: 11,
    mappedEntityCount: 9,
    diagnosticCount: 2,
  })
  expect(testCase.conversion.report.diagnostics).not.toContainEqual(
    expect.objectContaining({ code: "circuit-json-emitted-element-invalid" }),
  )
  expect(testCase.conversion.report.diagnostics).not.toContainEqual(
    expect.objectContaining({ code: "circuit-json-dangling-reference" }),
  )

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const cutoutsOnlySvg = renderConversionComparison({
    ...testCase,
    circuitJson: testCase.circuitJson.filter(
      ({ type }) => type === "pcb_board" || type === "pcb_cutout",
    ),
    padsOptions: { visibleGerberLayers: ["Edge_Cuts"] },
  })
  await expect(cutoutsOnlySvg).toMatchSvgSnapshot(
    import.meta.path,
    "cutouts-only",
  )

  const mountingCutoutsZoomSvg = renderConversionComparison({
    ...testCase,
    circuitJson: testCase.circuitJson.filter(
      ({ type }) => type === "pcb_board" || type === "pcb_cutout",
    ),
    padsOptions: { visibleGerberLayers: ["Edge_Cuts"] },
    boardViewBox: { x: 80, y: 116, width: 25, height: 25 },
  })
  await expect(mountingCutoutsZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "upper-mounting-cutouts-zoom",
  )
})
