import type { AnyCircuitElement } from "circuit-json"
import type {
  PadsBoardGeometry,
  PadsDocument,
  PadsGeometryPath,
  PadsSourceProvenance,
} from "padsts"
import type { PadsToCircuitJsonDiagnostic } from "../types"
import { toStableCircuitJsonId } from "./coordinates"
import { getBoardOutline } from "./geometry"

export interface ConversionContext {
  document: PadsDocument
  geometry: PadsBoardGeometry
  circuitJson: AnyCircuitElement[]
  diagnostics: PadsToCircuitJsonDiagnostic[]
  documentSource: PadsSourceProvenance
  outline?: PadsGeometryPath
  boardId: string
  handledPaths: Set<PadsGeometryPath>
  componentIdByReference: Map<string, string>
}

export const createConversionContext = ({
  document,
  geometry,
  documentSource,
}: {
  document: PadsDocument
  geometry: PadsBoardGeometry
  documentSource: PadsSourceProvenance
}): ConversionContext => {
  const outline = getBoardOutline(geometry)
  return {
    document,
    geometry,
    circuitJson: [],
    diagnostics: [],
    documentSource,
    outline,
    boardId: toStableCircuitJsonId("pcb_board", outline?.source?.sourceId, 0),
    handledPaths: new Set(),
    componentIdByReference: new Map(),
  }
}
