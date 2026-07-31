import { expect, test } from "bun:test"
import {
  conversionReportSchemaVersion,
  type PadsToCircuitJsonConverter,
  packageName,
} from "../lib"

test("exports stable package metadata", () => {
  expect(packageName).toBe("pads-to-circuit-json")
  expect(conversionReportSchemaVersion).toBe("1")
})

test("defines a typed converter boundary with loss reporting", () => {
  const converter: PadsToCircuitJsonConverter<{ type: string }> = (
    _source,
    options,
  ) => ({
    circuitJson: [{ type: "pcb_board" }],
    report: {
      schemaVersion: conversionReportSchemaVersion,
      strict: options?.strict ?? false,
      lossless: true,
      diagnostics: [],
    },
  })

  const result = converter("!PADS-POWERPCB-V9.5-MILS!", { strict: true })

  expect(result.circuitJson).toEqual([{ type: "pcb_board" }])
  expect(result.report.strict).toBe(true)
  expect(result.report.lossless).toBe(true)
})
