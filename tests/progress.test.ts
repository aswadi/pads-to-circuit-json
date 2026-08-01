import { expect, test } from "bun:test"
import {
  convertPadsToCircuitJson,
  PadsToCircuitJsonAbortError,
  type PadsToCircuitJsonProgress,
} from "../lib"

const fixtureUrl = new URL(
  "assets/downloaded/placed-decals.asc",
  import.meta.url,
)
const source = await Bun.file(fixtureUrl).text()

test("reports deterministic monotonic conversion progress", () => {
  const events: PadsToCircuitJsonProgress[] = []
  const result = convertPadsToCircuitJson(source, {
    onProgress: (progress) => events.push(progress),
  })

  expect(result.circuitJson.length).toBeGreaterThan(0)
  expect(events.map(({ stage }) => stage)).toEqual([
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
  ])
  expect(events.map(({ completedStages }) => completedStages)).toEqual(
    Array.from({ length: events.length }, (_, index) => index + 1),
  )
  expect(events.every(({ totalStages }) => totalStages === events.length)).toBe(
    true,
  )
})

test("honors a signal aborted before parsing", () => {
  const controller = new AbortController()
  controller.abort()

  expect(() =>
    convertPadsToCircuitJson(source, { signal: controller.signal }),
  ).toThrow(
    expect.objectContaining({
      name: "AbortError",
      stage: "parse",
    }),
  )
})

test("honors a signal aborted by a progress callback", () => {
  const controller = new AbortController()
  const completedStages: string[] = []

  expect(() =>
    convertPadsToCircuitJson(source, {
      signal: controller.signal,
      onProgress: ({ stage }) => {
        completedStages.push(stage)
        if (stage === "ports") controller.abort()
      },
    }),
  ).toThrow(
    expect.objectContaining({
      name: "AbortError",
      stage: "ports",
    }),
  )
  expect(completedStages.at(-1)).toBe("ports")
})

test("exports a typed abort error for callers", () => {
  const error = new PadsToCircuitJsonAbortError("validation")

  expect(error).toBeInstanceOf(Error)
  expect(error.name).toBe("AbortError")
  expect(error.stage).toBe("validation")
})
