import { expect, test } from "bun:test"
import { convertPadsToCircuitJson } from "../lib"

test("rejects unrecognized input with an actionable parser offset", () => {
  expect(() => convertPadsToCircuitJson("not a PADS file")).toThrow(
    expect.objectContaining({
      name: "PadsParseError",
      offset: 0,
    }),
  )
})

test("reports a truncated ASCII board with document and line provenance", () => {
  const truncatedBoard = `!PADS-POWERPCB-V9.5-MILS! DESIGN DATABASE ASCII FILE 1.0

*PCB*
UNITS 0
*LINES*
BROKEN BOARD 0 0 1 0
CLOSED 4 10 0 0
0 0
100 0
`
  const result = convertPadsToCircuitJson(truncatedBoard)

  expect(result.report.lossless).toBe(false)
  expect(result.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "ascii-missing-end",
      source: expect.objectContaining({
        section: "DOCUMENT",
        span: expect.objectContaining({ startLine: 1, endLine: 10 }),
      }),
    }),
  )
  expect(result.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "circuit-json-outline-path-not-represented",
      source: expect.objectContaining({
        section: "LINES",
        span: expect.objectContaining({ startLine: 6 }),
      }),
    }),
  )
})

test("rejects an unsupported native binary version at its version field", () => {
  const sourceBytes = new Uint8Array(4096)
  sourceBytes[0] = 0x00
  sourceBytes[1] = 0xff
  sourceBytes[2] = 0x99
  sourceBytes[3] = 0x99

  expect(() => convertPadsToCircuitJson(sourceBytes)).toThrow(
    expect.objectContaining({
      name: "PadsParseError",
      message: expect.stringContaining(
        "Unsupported PADS binary version 0x9999",
      ),
      offset: 2,
    }),
  )
})

test("reports empty sections and strict-mode loss without inventing a board", () => {
  const emptyBoard = `!PADS-POWERPCB-V9.5-MILS! DESIGN DATABASE ASCII FILE 1.0
*PCB*
MAXIMUMLAYER 2
*PART*
*LINES*
*END*
`
  const permissive = convertPadsToCircuitJson(emptyBoard)
  const strict = convertPadsToCircuitJson(emptyBoard, { strict: true })

  expect(permissive.circuitJson).toEqual([])
  expect(permissive.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "circuit-json-board-outline-unavailable",
      category: "unsupported",
    }),
  )
  expect(strict.report.lossless).toBe(false)
  expect(strict.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "strict-circuit-json-conversion-would-be-lossy",
      severity: "error",
    }),
  )
})

test("diagnoses a placement whose footprint reference cannot be resolved", () => {
  const invalidReferenceBoard = `!PADS-POWERPCB-V9.5-MILS! DESIGN DATABASE ASCII FILE 1.0
*PCB*
MAXIMUMLAYER 2
*PART*
U1 MISSING_DECAL 50 50 0 U N 0 -1 0 -1 0
*LINES*
BOARD_OUTLINE BOARD 0 0 1 0
CLOSED 5 4 0 0
0 0
100 0
100 100
0 100
0 0
*END*
`
  const result = convertPadsToCircuitJson(invalidReferenceBoard)

  expect(
    result.circuitJson.filter(({ type }) => type === "pcb_board"),
  ).toHaveLength(1)
  expect(
    result.circuitJson.filter(({ type }) => type === "pcb_component"),
  ).toEqual([])
  expect(result.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "circuit-json-component-bounds-unavailable",
      source: expect.objectContaining({
        section: "PART",
        span: expect.objectContaining({ startLine: 5 }),
      }),
    }),
  )
})

test("does not emit non-finite extreme outline coordinates", () => {
  const extremeBoard = `!PADS-POWERPCB-V9.5-MILS! DESIGN DATABASE ASCII FILE 1.0
*PCB*
MAXIMUMLAYER 2
*LINES*
BOARD_OUTLINE BOARD 0 0 1 0
CLOSED 5 4 0 0
0 0
1e309 0
1e309 1e309
0 1e309
0 0
*END*
`
  const result = convertPadsToCircuitJson(extremeBoard)

  expect(result.circuitJson).toEqual([])
  expect(result.report.lossless).toBe(false)
  expect(result.report.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "circuit-json-board-outline-unavailable",
    }),
  )
  expect(result.report.diagnostics).not.toContainEqual(
    expect.objectContaining({ code: "circuit-json-emitted-element-invalid" }),
  )
})

test("preserves hostile net text while generating safe deterministic IDs", () => {
  const hostileNetName = `N<&>"'`
  const hostileBoard = `!PADS-POWERPCB-V9.5-MILS! DESIGN DATABASE ASCII FILE 1.0
*PCB*
MAXIMUMLAYER 2
*ROUTE*
*SIGNAL* ${hostileNetName}
U1.1 U2.1
0 0 1 10 0
100 0 65 10 0
*LINES*
BOARD_OUTLINE BOARD 0 0 1 0
CLOSED 5 4 0 0
0 0
100 0
100 100
0 100
0 0
*END*
`
  const first = convertPadsToCircuitJson(hostileBoard)
  const second = convertPadsToCircuitJson(hostileBoard)
  const sourceNet = first.circuitJson.find(({ type }) => type === "source_net")
  const ownIds = first.circuitJson.flatMap((element) => {
    const value = (element as unknown as Record<string, unknown>)[
      `${element.type}_id`
    ]
    return typeof value === "string" ? [value] : []
  })

  expect(sourceNet).toEqual(expect.objectContaining({ name: hostileNetName }))
  expect(ownIds.every((id) => /^[A-Za-z0-9_]+$/u.test(id))).toBe(true)
  expect(first.circuitJson).toEqual(second.circuitJson)
  expect(() => JSON.stringify(first.report)).not.toThrow()
  expect(first.report.diagnostics).not.toContainEqual(
    expect.objectContaining({ code: "circuit-json-emitted-element-invalid" }),
  )
})
