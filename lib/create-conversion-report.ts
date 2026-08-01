import { createPadsConversionReport } from "padsts"
import type { ConversionContext } from "./internal/conversion-context"
import { createMappingCoverage } from "./internal/create-mapping-coverage"
import type { PadsToCircuitJsonReport } from "./types"

export const createConversionReport = (
  context: ConversionContext,
  strict: boolean,
): PadsToCircuitJsonReport => {
  const parserReport = createPadsConversionReport(context.document, {
    strict: false,
  })
  const diagnostics = [...parserReport.diagnostics, ...context.diagnostics]
  let mappingCoverage = createMappingCoverage(context, diagnostics)
  const lossless =
    parserReport.lossless &&
    diagnostics.length === 0 &&
    mappingCoverage.sourceEntities.total ===
      mappingCoverage.mappedEntities.total &&
    Boolean(context.outline)
  if (strict && !lossless) {
    diagnostics.push({
      code: "strict-circuit-json-conversion-would-be-lossy",
      severity: "error",
      category: "coverage",
      message:
        "Strict Circuit JSON conversion refused source data that cannot be represented exactly",
      source: context.documentSource,
    })
    mappingCoverage = createMappingCoverage(context, diagnostics)
  }
  const report: PadsToCircuitJsonReport = {
    ...parserReport,
    strict,
    lossless,
    diagnostics,
    mappingCoverage,
  }
  return report
}
