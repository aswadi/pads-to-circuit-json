import { expect } from "bun:test"
import { loadTestCase } from "./load-test-case"
import { renderConversionComparison } from "./render-conversion-comparison"

interface BinarySourceEntityCounts {
  paths?: number
  placements?: number
  unassignedVertices: number
  unverifiedConnections?: number
  unverifiedViaLocations?: number
}

interface ExpectedPartialBinaryConversion {
  assetId: string
  version: 0x2021 | 0x2025 | 0x2026 | 0x2027
  sourceEntities: BinarySourceEntityCounts
  diagnosticCount: number
  unsupportedSectionCount: number
  expectedParserDiagnosticCode: string
  testFilePath: string
}

const getDiagnosticCount = (
  diagnostics: { code: string }[],
  code: string,
): number => diagnostics.filter((diagnostic) => diagnostic.code === code).length

export const expectPartialBinaryConversion = async ({
  assetId,
  version,
  sourceEntities,
  diagnosticCount,
  unsupportedSectionCount,
  expectedParserDiagnosticCode,
  testFilePath,
}: ExpectedPartialBinaryConversion): Promise<void> => {
  const testCase = await loadTestCase(assetId)
  if (testCase.document.kind !== "binary") {
    throw new TypeError(`${assetId} did not parse as native PADS binary`)
  }

  const expectedCounts = {
    paths: sourceEntities.paths ?? 0,
    circles: 0,
    texts: 0,
    placements: sourceEntities.placements ?? 0,
    pads: 0,
    holes: 0,
    thermalReliefs: 0,
    antipads: 0,
    unassignedVertices: sourceEntities.unassignedVertices,
    unverifiedConnections: sourceEntities.unverifiedConnections ?? 0,
    unverifiedViaLocations: sourceEntities.unverifiedViaLocations ?? 0,
  }
  const expectedTotal = Object.values(expectedCounts).reduce(
    (total, count) => total + count,
    0,
  )
  const { diagnostics, mappingCoverage } = testCase.conversion.report

  expect(testCase.document.version).toBe(version)
  expect(testCase.circuitJson).toEqual([])
  expect(testCase.conversion.report.lossless).toBe(false)
  expect(mappingCoverage.sourceEntities).toEqual({
    ...expectedCounts,
    total: expectedTotal,
  })
  expect(mappingCoverage.mappedEntities.total).toBe(0)
  expect(mappingCoverage.emittedCircuitJsonElementCount).toBe(0)
  expect(mappingCoverage.emittedCircuitJsonElementsByType).toEqual({})
  expect(diagnostics).toHaveLength(diagnosticCount)
  expect(getDiagnosticCount(diagnostics, "binary-unsupported-section")).toBe(
    unsupportedSectionCount,
  )
  expect(
    getDiagnosticCount(diagnostics, "circuit-json-board-outline-unavailable"),
  ).toBe(1)
  expect(getDiagnosticCount(diagnostics, expectedParserDiagnosticCode)).toBe(1)
  expect(
    getDiagnosticCount(
      diagnostics,
      "circuit-json-component-bounds-unavailable",
    ),
  ).toBe(expectedCounts.placements)

  const structureComparison = renderConversionComparison({
    ...testCase,
    padsOptions: {
      visibleGerberLayers: [
        "Dwgs_User",
        "Debug_Vertices",
        "Debug_Connections",
        "Edge_Cuts",
      ],
      showPlacements: false,
      showUnassignedVertices: true,
      showUnverifiedConnections: true,
      clipArtworkToBoardOutline: false,
    },
  })
  expect(structureComparison).toContain('data-left-renderer="padsts"')
  expect(structureComparison).toContain('data-right-renderer="circuit-to-svg"')
  await expect(structureComparison).toMatchSvgSnapshot(
    testFilePath,
    "structure-comparison",
  )

  if (expectedCounts.placements === 0) return
  const placementComparison = renderConversionComparison({
    ...testCase,
    padsOptions: {
      visibleGerberLayers: [
        "F_Silkscreen",
        "B_Silkscreen",
        "F_Fab",
        "B_Fab",
        "Edge_Cuts",
      ],
      showPlacements: true,
      clipArtworkToBoardOutline: false,
    },
  })
  await expect(placementComparison).toMatchSvgSnapshot(
    testFilePath,
    "placement-comparison",
  )
}
