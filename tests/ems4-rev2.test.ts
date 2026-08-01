import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts the routed six-layer EMS4 Rev2 reference board", async () => {
  const testCase = await loadTestCase("ems4-rev2")
  const elementsOfType = (type: string) =>
    testCase.circuitJson.filter((element) => element.type === type)

  expect(elementsOfType("pcb_board")).toHaveLength(1)
  expect(elementsOfType("source_component")).toHaveLength(371)
  expect(elementsOfType("pcb_component")).toHaveLength(371)
  expect(elementsOfType("source_net")).toHaveLength(284)
  expect(elementsOfType("pcb_net")).toHaveLength(284)
  expect(elementsOfType("source_port")).toHaveLength(1_279)
  expect(elementsOfType("pcb_port")).toHaveLength(1_279)
  expect(elementsOfType("source_trace")).toHaveLength(284)
  expect(elementsOfType("pcb_smtpad")).toHaveLength(1_275)
  expect(elementsOfType("pcb_hole")).toHaveLength(40)
  expect(elementsOfType("pcb_plated_hole")).toHaveLength(4)
  expect(elementsOfType("pcb_trace")).toHaveLength(5_896)
  expect(elementsOfType("pcb_via")).toHaveLength(1_074)
  expect(elementsOfType("pcb_keepout")).toHaveLength(15)
  expect(elementsOfType("pcb_copper_pour")).toHaveLength(39)
  expect(elementsOfType("pcb_silkscreen_path")).toHaveLength(231)
  expect(elementsOfType("pcb_silkscreen_text")).toHaveLength(727)
  expect(elementsOfType("pcb_fabrication_note_path")).toHaveLength(180)
  expect(elementsOfType("pcb_silkscreen_text")).toContainEqual(
    expect.objectContaining({
      text: "C12",
      layer: "bottom",
      is_mirrored: true,
      ccw_rotation: 0,
      anchor_alignment: "top_left",
      pcb_component_id: expect.any(String),
    }),
  )
  expect(testCase.conversion.report.diagnostics).not.toContainEqual(
    expect.objectContaining({ code: "circuit-json-emitted-element-invalid" }),
  )
  expect(testCase.conversion.report.diagnostics).not.toContainEqual(
    expect.objectContaining({ code: "circuit-json-dangling-reference" }),
  )
  expect(testCase.conversion.report.mappingCoverage).toMatchObject({
    sourceEntities: { total: 9_941 },
    mappedEntities: { total: 9_857 },
    emittedCircuitJsonElementCount: 13_634,
    sections: {
      PART: {
        sourceEntityCount: 1_098,
        mappedEntityCount: 1_098,
        diagnosticCount: 1_098,
      },
      TEXT: {
        sourceEntityCount: 33,
        mappedEntityCount: 0,
        diagnosticCount: 33,
      },
    },
  })
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-silkscreen-text-font-approximated",
    ),
  ).toHaveLength(727)

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const finePitchZoomSvg = renderConversionComparison({
    ...testCase,
    boardViewBox: { x: 11, y: -2, width: 10, height: 12 },
  })
  await expect(finePitchZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "u10-u11-fine-pitch-zoom",
  )

  const keepoutZoomSvg = renderConversionComparison({
    ...testCase,
    circuitJson: testCase.circuitJson.filter(
      ({ type }) => type === "pcb_board" || type === "pcb_keepout",
    ),
    padsOptions: { visibleGerberLayers: ["Keepout", "Edge_Cuts"] },
    boardViewBox: { x: 11.3, y: -0.5, width: 2, height: 2 },
  })
  await expect(keepoutZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "c61-keepout-zoom",
  )
}, 30_000)
