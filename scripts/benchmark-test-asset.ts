import { parsePads } from "padsts"
import { convertPadsToCircuitJson } from "../lib"
import {
  calculateGitBlobSha,
  getTestAsset,
  getTestAssetPath,
} from "./test-assets"

const EMS4_RUNTIME_BUDGET_MS = 15_000
const EMS4_RESIDENT_MEMORY_BUDGET_BYTES = 512 * 1024 * 1024
const assetId = Bun.argv[2] ?? "ems4-rev2"
const asset = getTestAsset(assetId)
const bytes = await Bun.file(getTestAssetPath(asset)).bytes()
if (
  bytes.byteLength !== asset.expectedByteLength ||
  calculateGitBlobSha(bytes) !== asset.gitBlobSha
) {
  throw new Error(`${asset.fileName} failed its pinned fixture check`)
}

const start = performance.now()
const document = parsePads(bytes)
const conversion = convertPadsToCircuitJson(document)
const durationMs = performance.now() - start
const residentMemoryBytes = process.memoryUsage().rss
const result = {
  assetId,
  sourceByteLength: bytes.byteLength,
  durationMs: Math.round(durationMs),
  residentMemoryMiB: Math.round(residentMemoryBytes / 1024 / 1024),
  circuitJsonElementCount: conversion.circuitJson.length,
  normalizedEntityCount: conversion.report.mappingCoverage.sourceEntities.total,
}

console.log(JSON.stringify(result, null, 2))

if (assetId === "ems4-rev2") {
  if (durationMs > EMS4_RUNTIME_BUDGET_MS) {
    throw new Error(
      `EMS4 parse and conversion exceeded ${EMS4_RUNTIME_BUDGET_MS} ms`,
    )
  }
  if (residentMemoryBytes > EMS4_RESIDENT_MEMORY_BUDGET_BYTES) {
    throw new Error(
      "EMS4 conversion exceeded the 512 MiB resident-memory budget",
    )
  }
}
