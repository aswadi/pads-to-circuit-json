import type { AnyCircuitElement } from "circuit-json"
import type {
  PadsBoardGeometry,
  PadsDocument,
  PadsGeometryCircle,
  PadsGeometryPath,
  PadsGeometryText,
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
  handledCircles: Set<PadsGeometryCircle>
  handledTexts: Set<PadsGeometryText>
  mappedEntities: Set<object>
  componentIdByReference: Map<string, string>
  sourceComponentIdByReference: Map<string, string>
  sourceNetIdByName: Map<string, string>
  sourcePortIdByTerminal: Map<string, string>
  pcbPortIdByTerminal: Map<string, string>
  sourceTraceIdByNetName: Map<string, string>
  pcbTraceIdByNetName: Map<string, string>
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
    handledCircles: new Set(),
    handledTexts: new Set(),
    mappedEntities: new Set(),
    componentIdByReference: new Map(),
    sourceComponentIdByReference: new Map(),
    sourceNetIdByName: new Map(),
    sourcePortIdByTerminal: new Map(),
    pcbPortIdByTerminal: new Map(),
    sourceTraceIdByNetName: new Map(),
    pcbTraceIdByNetName: new Map(),
  }
}
