import type { PadsSourceProvenance } from "padsts"
import type {
  PadsToCircuitJsonDiagnostic,
  PadsToCircuitJsonEntityCounts,
  PadsToCircuitJsonMappingCoverage,
  PadsToCircuitJsonSectionCoverage,
} from "../types"
import type { ConversionContext } from "./conversion-context"

interface SourceEntity {
  source?: PadsSourceProvenance
}

const getSectionName = (source?: PadsSourceProvenance): string => {
  if (!source) return "UNKNOWN"
  return source.format === "ascii"
    ? source.section
    : `BINARY_${source.sectionIndex}`
}

const getEntityGroups = (context: ConversionContext) => ({
  paths: context.geometry.paths,
  circles: context.geometry.circles,
  texts: context.geometry.texts,
  placements: context.geometry.placements,
  pads: context.geometry.pads,
  holes: context.geometry.holes,
  thermalReliefs: context.geometry.thermalReliefs,
  antipads: context.geometry.antipads,
  unassignedVertices: context.geometry.unassignedVertices,
  unverifiedConnections: context.geometry.unverifiedConnections,
  unverifiedViaLocations: context.geometry.unverifiedViaLocations,
})

const countEntities = (
  context: ConversionContext,
  predicate: (entity: object) => boolean,
): PadsToCircuitJsonEntityCounts => {
  const groups = getEntityGroups(context)
  const counts = Object.fromEntries(
    Object.entries(groups).map(([name, entities]) => [
      name,
      entities.filter(predicate).length,
    ]),
  ) as Omit<PadsToCircuitJsonEntityCounts, "total">
  return {
    ...counts,
    total: Object.values(counts).reduce((total, count) => total + count, 0),
  }
}

const getAllSourceEntities = (context: ConversionContext): SourceEntity[] =>
  Object.values(getEntityGroups(context)).flat()

const getSectionCoverage = (
  context: ConversionContext,
  diagnostics: PadsToCircuitJsonDiagnostic[],
): Record<string, PadsToCircuitJsonSectionCoverage> => {
  const sections = new Map<string, PadsToCircuitJsonSectionCoverage>()
  const getSection = (name: string) => {
    const existing = sections.get(name)
    if (existing) return existing
    const created = {
      sourceEntityCount: 0,
      mappedEntityCount: 0,
      diagnosticCount: 0,
    }
    sections.set(name, created)
    return created
  }

  for (const entity of getAllSourceEntities(context)) {
    const section = getSection(getSectionName(entity.source))
    section.sourceEntityCount++
    if (context.mappedEntities.has(entity)) section.mappedEntityCount++
  }
  for (const diagnostic of diagnostics) {
    getSection(getSectionName(diagnostic.source)).diagnosticCount++
  }

  return Object.fromEntries(
    [...sections.entries()].sort(([a], [b]) => a.localeCompare(b)),
  )
}

export const createMappingCoverage = (
  context: ConversionContext,
  diagnostics: PadsToCircuitJsonDiagnostic[],
): PadsToCircuitJsonMappingCoverage => {
  const elementCounts = new Map<string, number>()
  for (const element of context.circuitJson) {
    elementCounts.set(element.type, (elementCounts.get(element.type) ?? 0) + 1)
  }
  const emittedCircuitJsonElementsByType = Object.fromEntries(
    [...elementCounts.entries()].sort(([a], [b]) => a.localeCompare(b)),
  )

  return {
    sourceEntities: countEntities(context, () => true),
    mappedEntities: countEntities(context, (entity) =>
      context.mappedEntities.has(entity),
    ),
    emittedCircuitJsonElementCount: context.circuitJson.length,
    emittedCircuitJsonElementsByType,
    sections: getSectionCoverage(context, diagnostics),
  }
}
