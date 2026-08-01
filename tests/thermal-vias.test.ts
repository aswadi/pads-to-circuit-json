import { expect, test } from "bun:test"
import { parsePads } from "padsts"
import { convertPadsToCircuitJson } from "../lib"
import { renderConversionComparison } from "./visual/render-conversion-comparison"

const fixtureUrl = new URL("./fixtures/thermal-vias.asc", import.meta.url)
const document = parsePads(await Bun.file(fixtureUrl).bytes())
const conversion = convertPadsToCircuitJson(document)

const getLayerViewCircuitJson = (layer: "inner1" | "inner2") =>
  conversion.circuitJson.filter(
    (element) =>
      element.type === "pcb_board" ||
      element.type === "pcb_via" ||
      (element.type === "pcb_copper_pour" && element.layer === layer),
  )

test("accounts for thermal reliefs and antipads without inventing plane ownership", async () => {
  expect(
    conversion.circuitJson.filter(({ type }) => type === "pcb_via"),
  ).toHaveLength(2)
  expect(
    conversion.circuitJson.filter(({ type }) => type === "pcb_copper_pour"),
  ).toHaveLength(2)
  expect(
    conversion.circuitJson.filter(({ type }) => type === "pcb_thermal_spoke"),
  ).toEqual([])
  expect(
    conversion.circuitJson.filter(({ type }) => type === "pcb_ground_plane"),
  ).toEqual([])

  expect(
    conversion.report.diagnostics.filter(
      ({ code }) =>
        code === "circuit-json-thermal-relief-ground-plane-unavailable",
    ),
  ).toHaveLength(2)
  expect(
    conversion.report.diagnostics.filter(
      ({ code }) => code === "circuit-json-antipad-not-represented",
    ),
  ).toHaveLength(2)
  expect(conversion.report.mappingCoverage.sourceEntities).toMatchObject({
    thermalReliefs: 2,
    antipads: 2,
  })
  expect(conversion.report.mappingCoverage.mappedEntities).toMatchObject({
    thermalReliefs: 0,
    antipads: 0,
  })
  expect(conversion.report.lossless).toBe(false)

  const comparisonSvg = renderConversionComparison({
    document,
    circuitJson: conversion.circuitJson,
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, "comparison")

  const focusedViews = [
    {
      name: "inner-1-antipads",
      padsLayer: "In1_Cu",
      circuitLayer: "inner1",
    },
    {
      name: "inner-2-thermal-reliefs",
      padsLayer: "In2_Cu",
      circuitLayer: "inner2",
    },
  ] as const

  for (const view of focusedViews) {
    const svg = renderConversionComparison({
      document,
      circuitJson: getLayerViewCircuitJson(view.circuitLayer),
      padsOptions: {
        visibleGerberLayers: [view.padsLayer, "Edge_Cuts"],
      },
      boardViewBox: { x: 3.048, y: 2.794, width: 9.144, height: 4.572 },
    })
    await expect(svg).toMatchSvgSnapshot(import.meta.path, view.name)
  }
})
