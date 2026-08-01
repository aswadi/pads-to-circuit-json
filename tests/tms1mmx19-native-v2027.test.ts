import { test } from "bun:test"
import { expectPartialBinaryConversion } from "./visual/expect-partial-binary-conversion"

test("records the partial TMS native v2027 conversion", async () => {
  await expectPartialBinaryConversion({
    assetId: "tms1mmx19-native-v2027",
    version: 0x2027,
    sourceEntities: {
      placements: 362,
      unassignedVertices: 1_927,
      unverifiedConnections: 890,
      unverifiedViaLocations: 964,
    },
    diagnosticCount: 4_180,
    unsupportedSectionCount: 34,
    expectedParserDiagnosticCode:
      "geometry-native-binary-route-and-via-candidates-are",
    testFilePath: import.meta.path,
  })
})
