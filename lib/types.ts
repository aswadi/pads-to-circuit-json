import type { AnyCircuitElement } from "circuit-json"
import type { PadsConversionReport, PadsDiagnostic, PadsDocument } from "padsts"

export type PadsSource = string | Uint8Array | PadsDocument

export interface PadsToCircuitJsonOptions {
  /** Report an error when the conversion is not exact and complete. */
  strict?: boolean
}

export interface PadsToCircuitJsonDiagnostic extends PadsDiagnostic {
  /** Circuit JSON IDs emitted from the source entity, when applicable. */
  circuitJsonIds?: string[]
}

export interface PadsToCircuitJsonReport
  extends Omit<PadsConversionReport, "diagnostics"> {
  diagnostics: PadsToCircuitJsonDiagnostic[]
}

export interface PadsToCircuitJsonResult {
  circuitJson: AnyCircuitElement[]
  report: PadsToCircuitJsonReport
}

export type PadsToCircuitJsonConverter = (
  source: PadsSource,
  options?: PadsToCircuitJsonOptions,
) => PadsToCircuitJsonResult
