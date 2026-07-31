export const packageName = "pads-to-circuit-json" as const

export const conversionReportSchemaVersion = "1" as const

export type PadsSource = string | Uint8Array

export interface PadsToCircuitJsonOptions {
  /** Fail when a source entity cannot be represented without loss. */
  strict?: boolean
}

export type ConversionDiagnosticSeverity = "warning" | "error"

export type ConversionDiagnosticCategory =
  | "unsupported"
  | "approximated"
  | "inferred"
  | "invalid"

export interface PadsToCircuitJsonDiagnostic {
  code: string
  severity: ConversionDiagnosticSeverity
  category: ConversionDiagnosticCategory
  message: string
  /** Stable parser/source identifier associated with the diagnostic. */
  sourceId?: string
  /** Circuit JSON IDs emitted for this source entity, if any. */
  circuitJsonIds?: string[]
  details?: Record<string, unknown>
}

export interface PadsToCircuitJsonReport {
  schemaVersion: typeof conversionReportSchemaVersion
  strict: boolean
  lossless: boolean
  diagnostics: PadsToCircuitJsonDiagnostic[]
}

export interface PadsToCircuitJsonResult<
  TCircuitElement = Record<string, unknown>,
> {
  circuitJson: TCircuitElement[]
  report: PadsToCircuitJsonReport
}

export type PadsToCircuitJsonConverter<
  TCircuitElement = Record<string, unknown>,
> = (
  source: PadsSource,
  options?: PadsToCircuitJsonOptions,
) => PadsToCircuitJsonResult<TCircuitElement>
