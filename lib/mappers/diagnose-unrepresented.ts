import type { ConversionContext } from "../internal/conversion-context"
import { createSkippedDiagnostic } from "../internal/diagnostics"

export const diagnoseUnrepresentedGeometry = (
  context: ConversionContext,
): void => {
  for (const path of context.geometry.paths) {
    if (context.handledPaths.has(path)) continue
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: `circuit-json-${path.kind}-path-not-represented`,
        message: `Skipped a ${path.kind} path because the current Circuit JSON adapter does not represent this path role or geometry`,
        entity: path,
        fallbackSource: context.documentSource,
      }),
    )
  }

  for (const text of context.geometry.texts) {
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: "circuit-json-text-not-represented",
        message:
          "Skipped decoded PADS text because text conversion is not implemented",
        entity: text,
        fallbackSource: context.documentSource,
      }),
    )
  }

  for (const point of context.geometry.unassignedVertices) {
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: "circuit-json-unassigned-vertex-not-represented",
        message:
          "Skipped an unassigned native vertex whose owning geometry is not verified",
        entity: point,
        fallbackSource: context.documentSource,
      }),
    )
  }

  for (const path of context.geometry.unverifiedConnections) {
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: "circuit-json-unverified-connection-not-represented",
        message:
          "Skipped a native connection candidate whose record layout is not verified",
        entity: path,
        fallbackSource: context.documentSource,
      }),
    )
  }

  for (const point of context.geometry.unverifiedViaLocations) {
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: "circuit-json-unverified-via-not-represented",
        message:
          "Skipped a native via candidate whose record layout is not verified",
        entity: point,
        fallbackSource: context.documentSource,
      }),
    )
  }
}
