import type { AnyCircuitElement } from "circuit-json"
import type { PadsConversionReport, PadsDiagnostic, PadsDocument } from "padsts"

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T

export type PadsSource = string | Uint8Array | DeepReadonly<PadsDocument>

export type PadsToCircuitJsonProgressStage =
  | "parse"
  | "normalize"
  | "board"
  | "board-cutouts"
  | "components"
  | "nets"
  | "ports"
  | "pads"
  | "holes"
  | "vias"
  | "routes"
  | "copper-regions"
  | "keepouts"
  | "silkscreen"
  | "fabrication"
  | "loss-accounting"
  | "validation"
  | "report"

export interface PadsToCircuitJsonProgress {
  stage: PadsToCircuitJsonProgressStage
  completedStages: number
  totalStages: number
}

export interface PadsToCircuitJsonOptions {
  /** Report an error when the conversion is not exact and complete. */
  strict?: boolean
  /** Abort before parsing or between deterministic conversion stages. */
  signal?: AbortSignal
  /** Receive one notification after each completed conversion stage. */
  onProgress?: (progress: PadsToCircuitJsonProgress) => void
}

export interface PadsToCircuitJsonDiagnostic extends PadsDiagnostic {
  /** Circuit JSON IDs emitted from the source entity, when applicable. */
  circuitJsonIds?: string[]
}

export interface PadsToCircuitJsonReport
  extends Omit<PadsConversionReport, "diagnostics"> {
  diagnostics: PadsToCircuitJsonDiagnostic[]
  mappingCoverage: PadsToCircuitJsonMappingCoverage
}

export interface PadsToCircuitJsonEntityCounts {
  paths: number
  circles: number
  texts: number
  placements: number
  pads: number
  holes: number
  thermalReliefs: number
  antipads: number
  unassignedVertices: number
  unverifiedConnections: number
  unverifiedViaLocations: number
  total: number
}

export interface PadsToCircuitJsonSectionCoverage {
  sourceEntityCount: number
  mappedEntityCount: number
  diagnosticCount: number
}

export interface PadsToCircuitJsonMappingCoverage {
  sourceEntities: PadsToCircuitJsonEntityCounts
  mappedEntities: PadsToCircuitJsonEntityCounts
  emittedCircuitJsonElementCount: number
  emittedCircuitJsonElementsByType: Record<string, number>
  sections: Record<string, PadsToCircuitJsonSectionCoverage>
}

export interface PadsToCircuitJsonResult {
  circuitJson: AnyCircuitElement[]
  report: PadsToCircuitJsonReport
}

export type PadsToCircuitJsonConverter = (
  source: PadsSource,
  options?: PadsToCircuitJsonOptions,
) => PadsToCircuitJsonResult
