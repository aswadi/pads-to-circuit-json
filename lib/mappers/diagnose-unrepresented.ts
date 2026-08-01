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

  for (const circle of context.geometry.circles) {
    if (context.handledCircles.has(circle)) continue
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: `circuit-json-${circle.kind}-circle-not-represented`,
        message: `Skipped a ${circle.kind} circle because the current Circuit JSON adapter does not represent this circle role or geometry`,
        entity: circle,
        fallbackSource: context.documentSource,
      }),
    )
  }

  for (const text of context.geometry.texts) {
    if (context.handledTexts.has(text)) continue
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

  for (const thermal of context.geometry.thermalReliefs) {
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: "circuit-json-thermal-relief-ground-plane-unavailable",
        message: `Skipped a decoded ${thermal.shape} thermal relief on physical layer ${thermal.layer} because pcb_thermal_spoke requires a verified pcb_ground_plane owner and the source plane association is not yet decoded`,
        entity: thermal,
        fallbackSource: context.documentSource,
      }),
    )
  }

  for (const antipad of context.geometry.antipads) {
    context.diagnostics.push(
      createSkippedDiagnostic({
        code: "circuit-json-antipad-not-represented",
        message: `Skipped a decoded ${antipad.shape} antipad on physical layer ${antipad.layer} because Circuit JSON has no standalone antipad entity and its source plane association is not yet decoded`,
        entity: antipad,
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
