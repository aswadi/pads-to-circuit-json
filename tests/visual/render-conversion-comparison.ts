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

export interface BoardViewBox {
  /** Lower-left X coordinate in millimeters. */
  x: number
  /** Lower-left Y coordinate in millimeters. */
  y: number
  width: number
  height: number
}

const makeSvgViewBoxSquare = (svg: string): string =>
  svg.replace(/viewBox="([^"]+)"/u, (attribute, coordinates: string) => {
    const [x, y, width, height] = coordinates.split(/\s+/u).map(Number)
    if (
      [x, y, width, height].some((value) => !Number.isFinite(value)) ||
      width === undefined ||
      height === undefined ||
      x === undefined ||
      y === undefined
    ) {
      return attribute
    }
    const size = Math.max(width, height)
    return `viewBox="${x - (size - width) / 2} ${y - (size - height) / 2} ${size} ${size}"`
  })

const getCircuitViewportFromPadsSvg = (
  svg: string,
): { minX: number; minY: number; maxX: number; maxY: number } | undefined => {
  const match = /viewBox="([^"]+)"/u.exec(svg)
  const coordinates = match?.[1]?.split(/\s+/u).map(Number)
  if (coordinates?.length !== 4) return undefined
  const [x, y, width, height] = coordinates
  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined ||
    [x, y, width, height].some((value) => !Number.isFinite(value))
  ) {
    return undefined
  }

  return {
    minX: x / 1_000_000,
    minY: -(y + height) / 1_000_000,
    maxX: (x + width) / 1_000_000,
    maxY: -y / 1_000_000,
  }
}

const createCaption = (text: string): string => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${VIEW_SIZE}"
  height="${CAPTION_HEIGHT}"
  viewBox="0 0 ${VIEW_SIZE} ${CAPTION_HEIGHT}"
>
  <rect width="${VIEW_SIZE}" height="${CAPTION_HEIGHT}" fill="${BACKGROUND_COLOR}" />
  <text x="18" y="24" fill="#f8fafc" font-family="ui-monospace, monospace" font-size="16">${text}</text>
</svg>`

const clipBoardViewport = (svg: string, clipId: string): string => {
  const lines = svg.split("\n")
  const transformedGroupLines = lines.flatMap((line, index) =>
    line.startsWith('  <g transform="') ? [index] : [],
  )
  const boardGroupLine = transformedGroupLines[1]
  const closingSvgLine = lines.lastIndexOf("</svg>")
  if (boardGroupLine === undefined || closingSvgLine < 0) return svg

  lines[0] += `
  <defs><clipPath id="${clipId}"><rect y="${CAPTION_HEIGHT}" width="${VIEW_SIZE}" height="${VIEW_SIZE}" /></clipPath></defs>`
  lines.splice(boardGroupLine, 0, `  <g clip-path="url(#${clipId})">`)
  lines.splice(closingSvgLine + 1, 0, "  </g>")
  return lines.join("\n")
}

const addCaption = (caption: string, svg: string, clipId: string): string =>
  clipBoardViewport(
    stackSvgsVertically([createCaption(caption), svg], {
      gap: 0,
      normalizeSize: false,
    }),
    clipId,
  )

const clipStackedColumns = (svg: string): string => {
  const definitions = `<defs>
    <clipPath id="comparison-left-column"><rect width="${VIEW_SIZE}" height="${VIEW_SIZE + CAPTION_HEIGHT}" /></clipPath>
    <clipPath id="comparison-right-column"><rect width="${VIEW_SIZE}" height="${VIEW_SIZE + CAPTION_HEIGHT}" /></clipPath>
  </defs>`
  return svg
    .replace(/(<svg[^>]*>)/u, `$1\n  ${definitions}`)
    .replace(
      '  <g transform="translate(0, 0) scale(1, 1) translate(0, 0)">',
      '  <g transform="translate(0, 0) scale(1, 1) translate(0, 0)" clip-path="url(#comparison-left-column)">',
    )
    .replace(
      `  <g transform="translate(${VIEW_SIZE + 20}, 0) scale(1, 1) translate(0, 0)">`,
      `  <g transform="translate(${VIEW_SIZE + 20}, 0) scale(1, 1) translate(0, 0)" clip-path="url(#comparison-right-column)">`,
    )
}

export const renderConversionComparison = ({
  document,
  circuitJson,
  padsOptions,
  boardViewBox,
}: {
  document: PadsDocument
  circuitJson: AnyCircuitElement[]
  padsOptions?: Omit<
    GeneratePadsSvgOptions,
    "width" | "height" | "viewBox" | "viewBoxUnits"
  >
  boardViewBox?: BoardViewBox
}): string => {
  const padsSvg = makeSvgViewBoxSquare(
    generateSvgFromPads(document, {
      width: VIEW_SIZE,
      height: VIEW_SIZE,
      backgroundColor: BACKGROUND_COLOR,
      showPlacements: false,
      showText: true,
      ...(boardViewBox
        ? {
            viewBox: {
              x: boardViewBox.x * 1_000_000,
              y: boardViewBox.y * 1_000_000,
              width: boardViewBox.width * 1_000_000,
              height: boardViewBox.height * 1_000_000,
            },
          }
        : {}),
      ...padsOptions,
    }),
  )
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    width: VIEW_SIZE,
    height: VIEW_SIZE,
    backgroundColor: BACKGROUND_COLOR,
    includeVersion: false,
    matchBoardAspectRatio: false,
    viewport: getCircuitViewportFromPadsSvg(padsSvg),
  })

  return clipStackedColumns(
    stackSvgsHorizontally(
      [
        addCaption("PADS source · padsts", padsSvg, "pads-board-viewport"),
        addCaption(
          "Converted Circuit JSON · circuit-to-svg",
          circuitJsonSvg,
          "circuit-json-board-viewport",
        ),
      ],
      {
        gap: 20,
        normalizeSize: false,
        rootAttributes: {
          "data-left-renderer": "padsts",
          "data-right-renderer": "circuit-to-svg",
        },
      },
    ),
  )
}
