import type { PadsSourceProvenance } from "padsts"
import type { PadsToCircuitJsonDiagnostic } from "../types"

interface SourceEntity {
  id?: string
  source?: PadsSourceProvenance
}

export const createSkippedDiagnostic = ({
  code,
  message,
  entity,
  fallbackSource,
}: {
  code: string
  message: string
  entity?: SourceEntity
  fallbackSource: PadsSourceProvenance
}): PadsToCircuitJsonDiagnostic => ({
  code,
  severity: "warning",
  category: "unsupported",
  message,
  source: entity?.source ?? fallbackSource,
  ...(entity?.id ? { entityIds: [entity.id] } : {}),
})

export const createApproximationDiagnostic = ({
  code,
  message,
  entity,
  circuitJsonIds,
  fallbackSource,
}: {
  code: string
  message: string
  entity: SourceEntity
  circuitJsonIds: string[]
  fallbackSource: PadsSourceProvenance
}): PadsToCircuitJsonDiagnostic => ({
  code,
  severity: "warning",
  category: "approximate",
  message,
  source: entity.source ?? fallbackSource,
  ...(entity.id ? { entityIds: [entity.id] } : {}),
  circuitJsonIds,
})
