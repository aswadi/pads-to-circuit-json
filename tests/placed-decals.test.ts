import { expect, test } from "bun:test"
import { convertPadsToCircuitJson } from "../lib"
import { deepFreeze } from "./fixtures/deep-freeze"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts placed decals and compares both renderers", async () => {
  const testCase = await loadTestCase("placed-decals")
  const elementTypes = testCase.circuitJson.map(({ type }) => type)

  expect(elementTypes.filter((type) => type === "pcb_board")).toHaveLength(1)
  expect(
    elementTypes.filter((type) => type === "source_component"),
  ).toHaveLength(2)
  expect(elementTypes.filter((type) => type === "pcb_component")).toHaveLength(
    2,
  )
  expect(elementTypes.filter((type) => type === "pcb_smtpad")).toHaveLength(8)
  const components = testCase.circuitJson.filter(
    (element) => element.type === "pcb_component",
  )
  const pads = testCase.circuitJson.filter(
    (element) => element.type === "pcb_smtpad",
  )
  expect(
    components.map(
      ({ pcb_component_id }) =>
        pads.filter((pad) => pad.pcb_component_id === pcb_component_id).length,
    ),
  ).toEqual([4, 4])
  expect(new Set(pads.map(({ pcb_smtpad_id }) => pcb_smtpad_id)).size).toBe(8)
  expect(testCase.conversion.report.mappingCoverage.sourceEntities.pads).toBe(8)
  expect(testCase.conversion.report.mappingCoverage.mappedEntities.pads).toBe(8)
  expect(
    testCase.circuitJson.filter(
      (element) => element.type === "source_component",
    ),
  ).toEqual([
    expect.objectContaining({
      name: "U1",
      display_name: "U1",
      display_value: "SHAPE_TYPE",
    }),
    expect.objectContaining({
      name: "U2",
      display_name: "U2",
      display_value: "SHAPE_TYPE",
    }),
  ])
  expect(testCase.conversion.report.lossless).toBe(false)
  expect(convertPadsToCircuitJson(testCase.bytes).circuitJson).toEqual(
    testCase.conversion.circuitJson,
  )
  expect(
    convertPadsToCircuitJson(new TextDecoder().decode(testCase.bytes))
      .circuitJson,
  ).toEqual(testCase.conversion.circuitJson)
  expect(
    convertPadsToCircuitJson(deepFreeze(testCase.document)).circuitJson,
  ).toEqual(testCase.conversion.circuitJson)
  const ownIds = testCase.circuitJson.flatMap((element) => {
    const id = (element as unknown as Record<string, unknown>)[
      `${element.type}_id`
    ]
    return typeof id === "string" ? [id] : []
  })
  expect(new Set(ownIds).size).toBe(ownIds.length)
  expect(testCase.conversion.report.diagnostics).not.toContainEqual(
    expect.objectContaining({ code: "circuit-json-dangling-reference" }),
  )

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const rotatedPadsZoomSvg = renderConversionComparison({
    ...testCase,
    boardViewBox: { x: 1.5, y: 1.7, width: 4.2, height: 4.2 },
  })
  await expect(rotatedPadsZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "rotated-pads-zoom",
  )
})
