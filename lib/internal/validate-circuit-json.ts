import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import type { ConversionContext } from "./conversion-context"

const getOwnIdEntry = (
  element: AnyCircuitElement,
): [string, string] | undefined => {
  const ownIdKey = `${element.type}_id`
  const value = (element as unknown as Record<string, unknown>)[ownIdKey]
  return typeof value === "string" ? [ownIdKey, value] : undefined
}

const getReferenceTargetKey = (key: string): string =>
  key
    .replace(/^(?:connected_|positioned_relative_to_|start_|end_)/u, "")
    .replace(/_ids$/u, "_id")

const REFERENCE_ID_KEYS = new Set([
  "pcb_board_id",
  "pcb_component_id",
  "pcb_group_id",
  "pcb_port_id",
  "pcb_trace_id",
  "source_component_id",
  "source_group_id",
  "source_net_id",
  "source_port_id",
  "source_trace_id",
  "subcircuit_id",
])

export const validateCircuitJson = (context: ConversionContext): void => {
  const seenIds = new Set<string>()
  context.circuitJson = context.circuitJson.filter((element) => {
    const ownIdEntry = getOwnIdEntry(element)
    if (ownIdEntry && seenIds.has(ownIdEntry[1])) {
      context.diagnostics.push({
        code: "circuit-json-duplicate-element-id",
        severity: "error",
        category: "validation",
        message: `Removed a duplicate ${element.type} element with ID ${ownIdEntry[1]}`,
        source: context.documentSource,
        circuitJsonIds: [ownIdEntry[1]],
      })
      return false
    }

    const result = any_circuit_element.safeParse(element)
    if (result.success) {
      if (ownIdEntry) seenIds.add(ownIdEntry[1])
      return true
    }

    const circuitJsonId = ownIdEntry?.[1]
    context.diagnostics.push({
      code: "circuit-json-emitted-element-invalid",
      severity: "error",
      category: "validation",
      message: `Removed an invalid ${element.type} element: ${result.error.issues
        .map(
          (issue) => `${issue.path.join(".") || "element"}: ${issue.message}`,
        )
        .join("; ")}`,
      source: context.documentSource,
      ...(circuitJsonId ? { circuitJsonIds: [circuitJsonId] } : {}),
    })
    return false
  })

  const idsByKey = new Map<string, Set<string>>()
  for (const element of context.circuitJson) {
    const ownIdEntry = getOwnIdEntry(element)
    if (!ownIdEntry) continue
    const ids = idsByKey.get(ownIdEntry[0]) ?? new Set<string>()
    ids.add(ownIdEntry[1])
    idsByKey.set(ownIdEntry[0], ids)
  }

  for (const element of context.circuitJson) {
    const ownIdEntry = getOwnIdEntry(element)
    const danglingReferences = Object.entries(element).flatMap(
      ([key, value]) => {
        if (key === ownIdEntry?.[0]) return []
        const targetKey = getReferenceTargetKey(key)
        if (!REFERENCE_ID_KEYS.has(targetKey)) return []
        const referenceIds = Array.isArray(value)
          ? value.filter((item): item is string => typeof item === "string")
          : typeof value === "string"
            ? [value]
            : []
        return referenceIds.filter(
          (referenceId) => !idsByKey.get(targetKey)?.has(referenceId),
        )
      },
    )
    if (danglingReferences.length === 0) continue
    context.diagnostics.push({
      code: "circuit-json-dangling-reference",
      severity: "error",
      category: "validation",
      message: `Emitted ${element.type} with dangling Circuit JSON references: ${danglingReferences.join(", ")}`,
      source: context.documentSource,
      ...(ownIdEntry ? { circuitJsonIds: [ownIdEntry[1]] } : {}),
      details: { danglingReferenceIds: danglingReferences },
    })
  }
}
