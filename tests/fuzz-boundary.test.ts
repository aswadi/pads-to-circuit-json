import { expect, test } from "bun:test"
import { parsePads } from "padsts"
import { convertPadsToCircuitJson } from "../lib"

const fixtureUrl = new URL(
  "assets/downloaded/placed-decals.asc",
  import.meta.url,
)
const baseSource = await Bun.file(fixtureUrl).text()

const terminalTokens = [
  "U1.1",
  "U1.4",
  "U2.2",
  "U2.99",
  "MISSING.1",
  "1.1",
  "U1.",
  ".1",
  "not-a-terminal",
] as const

const netNames = ["GND", "+3V3", "N<&>\"'", "N/USB-D+", "123", "_"] as const

let randomState = 0x3326a64
const nextIndex = (length: number): number => {
  randomState ^= randomState << 13
  randomState ^= randomState >>> 17
  randomState ^= randomState << 5
  return (randomState >>> 0) % length
}

test("fuzzes parser-to-adapter terminal reference resolution", () => {
  for (let iteration = 0; iteration < 48; iteration++) {
    const firstTerminal = terminalTokens[nextIndex(terminalTokens.length)]!
    const secondTerminal = terminalTokens[nextIndex(terminalTokens.length)]!
    const firstNet = netNames[nextIndex(netNames.length)]!
    const secondNet = netNames[nextIndex(netNames.length)]!
    const netSection = `*NET*        FUZZED NET ITEMS

*SIGNAL* ${firstNet}
${firstTerminal} ${secondTerminal}
*SIGNAL* ${secondNet}
${iteration % 5 === 0 ? firstTerminal : secondTerminal}

`
    const source = baseSource.replace(
      "*LINES*      LINES ITEMS",
      `${netSection}*LINES*      LINES ITEMS`,
    )

    const fromText = convertPadsToCircuitJson(source)
    const fromDocument = convertPadsToCircuitJson(parsePads(source))

    expect(fromText).toEqual(fromDocument)
    expect(JSON.parse(JSON.stringify(fromText.report))).toEqual(fromText.report)
    expect(fromText.report.diagnostics).not.toContainEqual(
      expect.objectContaining({
        code: "circuit-json-emitted-element-invalid",
      }),
    )
    expect(fromText.report.diagnostics).not.toContainEqual(
      expect.objectContaining({ code: "circuit-json-dangling-reference" }),
    )
  }
})
