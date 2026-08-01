import { test } from "bun:test"
import { expectPartialBinaryConversion } from "./visual/expect-partial-binary-conversion"

test("records the partial Dexter native v2021 conversion", async () => {
  await expectPartialBinaryConversion({
    assetId: "dexter-native-v2021",
    version: 0x2021,
    sourceEntities: { unassignedVertices: 565 },
    diagnosticCount: 607,
    unsupportedSectionCount: 37,
    expectedParserDiagnosticCode:
      "geometry-native-binary-version-0x2021-placement-y-coordinates",
    testFilePath: import.meta.path,
  })
})
