import {
  extractPadsBoardGeometry,
  getPadsDocumentSourceProvenance,
  type PadsDocument,
  parsePads,
} from "padsts"
import { PadsToCircuitJsonAbortError } from "./conversion-aborted-error"
import { createConversionReport } from "./create-conversion-report"
import { createConversionContext } from "./internal/conversion-context"
import { validateCircuitJson } from "./internal/validate-circuit-json"
import { diagnoseUnrepresentedGeometry } from "./mappers/diagnose-unrepresented"
import { mapBoard } from "./mappers/map-board"
import { mapBoardCutouts } from "./mappers/map-board-cutouts"
import { mapComponents } from "./mappers/map-components"
import { mapCopperRegions } from "./mappers/map-copper-regions"
import { mapFabrication } from "./mappers/map-fabrication"
import { mapHoles } from "./mappers/map-holes"
import { mapKeepouts } from "./mappers/map-keepouts"
import { mapNets } from "./mappers/map-nets"
import { mapPads } from "./mappers/map-pads"
import { mapPorts } from "./mappers/map-ports"
import { mapRoutes } from "./mappers/map-routes"
import { mapSilkscreen } from "./mappers/map-silkscreen"
import { mapVias } from "./mappers/map-vias"
import type {
  PadsSource,
  PadsToCircuitJsonOptions,
  PadsToCircuitJsonProgressStage,
  PadsToCircuitJsonResult,
} from "./types"

const CONVERSION_STAGES = [
  "parse",
  "normalize",
  "board",
  "board-cutouts",
  "components",
  "nets",
  "ports",
  "pads",
  "holes",
  "routes",
  "vias",
  "copper-regions",
  "keepouts",
  "silkscreen",
  "fabrication",
  "loss-accounting",
  "validation",
  "report",
] as const satisfies readonly PadsToCircuitJsonProgressStage[]

const getDocument = (source: PadsSource) =>
  typeof source === "string" || source instanceof Uint8Array
    ? parsePads(source)
    : (source as PadsDocument)

export const convertPadsToCircuitJson = (
  source: PadsSource,
  { strict = false, signal, onProgress }: PadsToCircuitJsonOptions = {},
): PadsToCircuitJsonResult => {
  let completedStages = 0
  const runStage = <Result>(
    stage: PadsToCircuitJsonProgressStage,
    operation: () => Result,
  ): Result => {
    if (signal?.aborted) throw new PadsToCircuitJsonAbortError(stage)
    const result = operation()
    completedStages++
    onProgress?.({
      stage,
      completedStages,
      totalStages: CONVERSION_STAGES.length,
    })
    if (signal?.aborted) throw new PadsToCircuitJsonAbortError(stage)
    return result
  }

  const document = runStage("parse", () => getDocument(source))
  const geometry = runStage("normalize", () =>
    extractPadsBoardGeometry(document),
  )
  const context = createConversionContext({
    document,
    geometry,
    documentSource: getPadsDocumentSourceProvenance(document),
  })

  runStage("board", () => mapBoard(context))
  runStage("board-cutouts", () => mapBoardCutouts(context))
  runStage("components", () => mapComponents(context))
  runStage("nets", () => mapNets(context))
  runStage("ports", () => mapPorts(context))
  runStage("pads", () => mapPads(context))
  runStage("holes", () => mapHoles(context))
  runStage("routes", () => mapRoutes(context))
  runStage("vias", () => mapVias(context))
  runStage("copper-regions", () => mapCopperRegions(context))
  runStage("keepouts", () => mapKeepouts(context))
  runStage("silkscreen", () => mapSilkscreen(context))
  runStage("fabrication", () => mapFabrication(context))
  runStage("loss-accounting", () => diagnoseUnrepresentedGeometry(context))
  runStage("validation", () => validateCircuitJson(context))
  const report = runStage("report", () =>
    createConversionReport(context, strict),
  )

  return {
    circuitJson: context.circuitJson,
    report,
  }
}

export const toCircuitJson = (source: PadsSource) =>
  convertPadsToCircuitJson(source).circuitJson
