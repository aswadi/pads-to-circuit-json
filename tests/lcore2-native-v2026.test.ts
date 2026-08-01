import { test } from "bun:test"
import { expectPartialBinaryConversion } from "./visual/expect-partial-binary-conversion"

test("records the partial LCORE2 native v2026 conversion", async () => {
  await expectPartialBinaryConversion({
    assetId: "lcore2-native-v2026",
    version: 0x2026,
    sourceEntities: {
      paths: 1,
      placements: 19,
      unassignedVertices: 1_554,
      unverifiedConnections: 29,
      unverifiedViaLocations: 51,
    },
    diagnosticCount: 1_694,
    unsupportedSectionCount: 36,
    expectedParserDiagnosticCode:
      "geometry-version-0x2026-section-21-candidate-paths-are",
    testFilePath: import.meta.path,
  })
})
