import { test } from "bun:test"
import { expectPartialBinaryConversion } from "./visual/expect-partial-binary-conversion"

test("records the partial EMS4 native v2025 conversion", async () => {
  await expectPartialBinaryConversion({
    assetId: "ems4-native-v2025",
    version: 0x2025,
    sourceEntities: {
      placements: 364,
      unassignedVertices: 1_839,
      unverifiedConnections: 98,
      unverifiedViaLocations: 1_666,
    },
    diagnosticCount: 4_009,
    unsupportedSectionCount: 38,
    expectedParserDiagnosticCode:
      "geometry-native-binary-route-and-via-candidates-are",
    testFilePath: import.meta.path,
  })
})
