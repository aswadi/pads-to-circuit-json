import { expect, test } from "bun:test"
import { loadTestCase } from "./visual/load-test-case"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

test("converts the routed LCORE2 reference board", async () => {
  const testCase = await loadTestCase("lcore2")
  const elementsOfType = (type: string) =>
    testCase.circuitJson.filter((element) => element.type === type)
  const getPcbComponentId = (reference: string): string => {
    const sourceComponent = testCase.circuitJson.find(
      (element) =>
        element.type === "source_component" && element.name === reference,
    )
    const pcbComponent = testCase.circuitJson.find(
      (element) =>
        element.type === "pcb_component" &&
        sourceComponent?.type === "source_component" &&
        element.source_component_id === sourceComponent.source_component_id,
    )
    if (pcbComponent?.type !== "pcb_component") {
      throw new Error(`Missing PCB component for ${reference}`)
    }
    return pcbComponent.pcb_component_id
  }

  expect(elementsOfType("pcb_board")).toHaveLength(1)
  expect(elementsOfType("source_component")).toHaveLength(30)
  expect(elementsOfType("pcb_component")).toHaveLength(30)
  expect(elementsOfType("source_net")).toHaveLength(14)
  expect(elementsOfType("pcb_net")).toHaveLength(14)
  expect(elementsOfType("source_port")).toHaveLength(69)
  expect(elementsOfType("pcb_port")).toHaveLength(69)
  expect(elementsOfType("source_trace")).toHaveLength(14)
  expect(elementsOfType("pcb_smtpad")).toHaveLength(69)
  expect(elementsOfType("pcb_hole")).toHaveLength(4)
  expect(elementsOfType("pcb_trace")).toHaveLength(229)
  expect(elementsOfType("pcb_via")).toHaveLength(24)
  expect(
    elementsOfType("pcb_via").every(
      (via) => "pcb_trace_id" in via && typeof via.pcb_trace_id === "string",
    ),
  ).toBe(true)
  expect(elementsOfType("pcb_keepout")).toHaveLength(2)
  expect(elementsOfType("pcb_fabrication_note_path")).toHaveLength(50)
  expect(elementsOfType("pcb_silkscreen_text")).toHaveLength(58)
  expect(elementsOfType("pcb_silkscreen_text")).toContainEqual(
    expect.objectContaining({
      text: "C4",
      font: "tscircuit2024",
      font_size: 1.2,
      ccw_rotation: 270,
      layer: "bottom",
      is_mirrored: true,
      anchor_position: { x: 1.748, y: -13.746752666666666 },
      anchor_alignment: "top_left",
      pcb_component_id: expect.any(String),
    }),
  )
  expect(elementsOfType("source_net")).toContainEqual(
    expect.objectContaining({ name: "GND" }),
  )
  expect(elementsOfType("source_trace")).toContainEqual(
    expect.objectContaining({
      connected_source_net_ids: expect.arrayContaining([expect.any(String)]),
      connected_source_port_ids: expect.arrayContaining([expect.any(String)]),
    }),
  )
  expect(
    elementsOfType("pcb_smtpad").every(
      (pad) => "pcb_port_id" in pad && typeof pad.pcb_port_id === "string",
    ),
  ).toBe(true)
  expect(testCase.conversion.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "circuit-json-board-arcs-segmented",
      severity: "warning",
    }),
  )
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-text-not-represented",
    ),
  ).toHaveLength(17)
  expect(
    testCase.conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-silkscreen-text-font-approximated",
    ),
  ).toHaveLength(58)
  expect(testCase.conversion.report.diagnostics).not.toContainEqual(
    expect.objectContaining({
      code: "circuit-json-via-net-association-not-represented",
    }),
  )

  const comparisonSvg = renderConversionComparison(testCase)
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const denseRoutingZoomSvg = renderConversionComparison({
    ...testCase,
    boardViewBox: { x: -4, y: -17.5, width: 9, height: 9 },
  })
  await expect(denseRoutingZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "dense-routing-zoom",
  )

  const tp1ComponentId = getPcbComponentId("TP1")
  const topComponentLabelZoomSvg = renderConversionComparison({
    ...testCase,
    circuitJson: testCase.circuitJson.filter(
      (element) =>
        element.type === "pcb_board" ||
        (element.type === "pcb_silkscreen_text" &&
          element.pcb_component_id === tp1ComponentId),
    ),
    padsOptions: {
      visibleGerberLayers: ["F_Silkscreen", "Edge_Cuts"],
      visibleTextReferences: ["TP1"],
    },
    boardViewBox: { x: -12, y: -17, width: 7, height: 8 },
  })
  await expect(topComponentLabelZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "top-component-label-zoom",
  )

  const u5ComponentId = getPcbComponentId("U5")
  const bottomComponentLabelZoomSvg = renderConversionComparison({
    ...testCase,
    circuitJson: testCase.circuitJson.filter(
      (element) =>
        element.type === "pcb_board" ||
        (element.type === "pcb_silkscreen_text" &&
          element.pcb_component_id === u5ComponentId),
    ),
    padsOptions: {
      visibleGerberLayers: ["B_Silkscreen", "Edge_Cuts"],
      visibleTextReferences: ["U5"],
    },
    boardViewBox: { x: -7, y: -14, width: 7, height: 8 },
  })
  await expect(bottomComponentLabelZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "bottom-component-label-zoom",
  )

  const boardArcZoomSvg = renderConversionComparison({
    ...testCase,
    circuitJson: testCase.circuitJson.filter(
      ({ type }) => type === "pcb_board",
    ),
    padsOptions: { visibleGerberLayers: ["Edge_Cuts"] },
    boardViewBox: { x: 7.2, y: -22.2, width: 4, height: 6.5 },
  })
  await expect(boardArcZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "board-arc-zoom",
  )

  const mirroredTextZoomSvg = renderConversionComparison({
    ...testCase,
    circuitJson: testCase.circuitJson.filter(
      ({ type }) => type === "pcb_board",
    ),
    padsOptions: {
      showText: true,
      visibleGerberLayers: ["B_Silkscreen", "Edge_Cuts"],
    },
    boardViewBox: { x: 2.5, y: -12, width: 6.5, height: 6.5 },
  })
  await expect(mirroredTextZoomSvg).toMatchSvgSnapshot(
    import.meta.path,
    "mirrored-text-zoom",
  )
})
