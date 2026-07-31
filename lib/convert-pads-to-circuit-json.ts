import {
  extractPadsBoardGeometry,
  getPadsDocumentSourceProvenance,
  parsePads,
} from "padsts"
import { createConversionReport } from "./create-conversion-report"
import { createConversionContext } from "./internal/conversion-context"
import { diagnoseUnrepresentedGeometry } from "./mappers/diagnose-unrepresented"
import { mapBoard } from "./mappers/map-board"
import { mapComponents } from "./mappers/map-components"
import { mapHoles } from "./mappers/map-holes"
import { mapPads } from "./mappers/map-pads"
import { mapRoutes } from "./mappers/map-routes"
import { mapSilkscreen } from "./mappers/map-silkscreen"
import { mapViasAndDiagnoseCircles } from "./mappers/map-vias"
import type {
  PadsSource,
  PadsToCircuitJsonOptions,
  PadsToCircuitJsonResult,
} from "./types"

const getDocument = (source: PadsSource) =>
  typeof source === "string" || source instanceof Uint8Array
    ? parsePads(source)
    : source

export const convertPadsToCircuitJson = (
  source: PadsSource,
  { strict = false }: PadsToCircuitJsonOptions = {},
): PadsToCircuitJsonResult => {
  const document = getDocument(source)
  const context = createConversionContext({
    document,
    geometry: extractPadsBoardGeometry(document),
    documentSource: getPadsDocumentSourceProvenance(document),
  })

  mapBoard(context)
  mapComponents(context)
  mapPads(context)
  mapHoles(context)
  mapViasAndDiagnoseCircles(context)
  mapRoutes(context)
  mapSilkscreen(context)
  diagnoseUnrepresentedGeometry(context)

  return {
    circuitJson: context.circuitJson,
    report: createConversionReport(context, strict),
  }
}

export const toCircuitJson = (source: PadsSource) =>
  convertPadsToCircuitJson(source).circuitJson
