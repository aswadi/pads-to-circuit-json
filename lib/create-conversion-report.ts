import { createPadsConversionReport } from "padsts"
import type { ConversionContext } from "./internal/conversion-context"
import type { PadsToCircuitJsonReport } from "./types"

export const createConversionReport = (
  context: ConversionContext,
  strict: boolean,
): PadsToCircuitJsonReport => {
  const parserReport = createPadsConversionReport(context.document, {
    strict: false,
  })
  const report: PadsToCircuitJsonReport = {
    ...parserReport,
    strict,
    lossless:
      parserReport.lossless &&
      context.diagnostics.length === 0 &&
      Boolean(context.outline),
    diagnostics: [...parserReport.diagnostics, ...context.diagnostics],
  }

  if (strict && !report.lossless) {
    report.diagnostics.push({
      code: "strict-circuit-json-conversion-would-be-lossy",
      severity: "error",
      category: "coverage",
      message:
        "Strict Circuit JSON conversion refused source data that cannot be represented exactly",
      source: context.documentSource,
    })
  }
  return report
}
