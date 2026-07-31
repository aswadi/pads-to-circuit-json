import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  type GeneratePadsSvgOptions,
  generateSvgFromPads,
  type PadsDocument,
} from "padsts"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"

const VIEW_SIZE = 600
const CAPTION_HEIGHT = 36
const BACKGROUND_COLOR = "#111827"

const createCaption = (text: string): string => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${VIEW_SIZE}"
  height="${CAPTION_HEIGHT}"
  viewBox="0 0 ${VIEW_SIZE} ${CAPTION_HEIGHT}"
>
  <rect width="${VIEW_SIZE}" height="${CAPTION_HEIGHT}" fill="${BACKGROUND_COLOR}" />
  <text x="18" y="24" fill="#f8fafc" font-family="ui-monospace, monospace" font-size="16">${text}</text>
</svg>`

const addCaption = (caption: string, svg: string): string =>
  stackSvgsVertically([createCaption(caption), svg], {
    gap: 0,
    normalizeSize: false,
  })

export const renderConversionComparison = ({
  document,
  circuitJson,
  padsOptions,
}: {
  document: PadsDocument
  circuitJson: AnyCircuitElement[]
  padsOptions?: Omit<GeneratePadsSvgOptions, "width" | "height">
}): string => {
  const padsSvg = generateSvgFromPads(document, {
    width: VIEW_SIZE,
    height: VIEW_SIZE,
    backgroundColor: BACKGROUND_COLOR,
    showPlacements: false,
    showText: false,
    ...padsOptions,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    width: VIEW_SIZE,
    height: VIEW_SIZE,
    backgroundColor: BACKGROUND_COLOR,
    includeVersion: false,
    matchBoardAspectRatio: false,
  })

  return stackSvgsHorizontally(
    [
      addCaption("PADS source · padsts", padsSvg),
      addCaption("Converted Circuit JSON · circuit-to-svg", circuitJsonSvg),
    ],
    {
      gap: 20,
      normalizeSize: false,
      rootAttributes: {
        "data-left-renderer": "padsts",
        "data-right-renderer": "circuit-to-svg",
      },
    },
  )
}
