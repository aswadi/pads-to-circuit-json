import { createHash } from "node:crypto"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export interface TestAsset {
  id: string
  fileName: string
  expectedByteLength: number
  gitBlobSha: string
  downloadUrl: string
  sourceUrl: string
  licenseUrl: string
}

const PADSTS_COMMIT = "ab684ed"
const PADSTS_RAW_ROOT = `https://raw.githubusercontent.com/tscircuit/padsts/${PADSTS_COMMIT}`
const PADSTS_BLOB_ROOT = `https://github.com/tscircuit/padsts/blob/${PADSTS_COMMIT}`
const KICAD_COMMIT = "06bf3c7acd99d850ac9bf94f9182ba8c9e89b620"
const KICAD_PADS_ROOT = `qa/data/pcbnew/plugins/pads/LCORE_2`

export const testAssetDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../tests/assets/downloaded",
)

const fromPadstsFixture = (
  fixture: Pick<
    TestAsset,
    "id" | "fileName" | "expectedByteLength" | "gitBlobSha"
  >,
): TestAsset => ({
  ...fixture,
  downloadUrl: `${PADSTS_RAW_ROOT}/tests/fixtures/${fixture.fileName}`,
  sourceUrl: `${PADSTS_BLOB_ROOT}/tests/fixtures/${fixture.fileName}`,
  licenseUrl: `${PADSTS_BLOB_ROOT}/LICENSE`,
})

export const testAssets: TestAsset[] = [
  fromPadstsFixture({
    id: "placed-decals",
    fileName: "placed-decals.asc",
    expectedByteLength: 755,
    gitBlobSha: "2827c8ef1fb0c72f44dce6f7ee3d77f9ff900c68",
  }),
  fromPadstsFixture({
    id: "drilled-decals",
    fileName: "drilled-decals.asc",
    expectedByteLength: 947,
    gitBlobSha: "0585a1c67feb60988d4534beef0d5e7bf1d05e09",
  }),
  fromPadstsFixture({
    id: "layered-vias",
    fileName: "layered-vias.asc",
    expectedByteLength: 798,
    gitBlobSha: "788dd1121bf275f3b4839197457567515b50284a",
  }),
  fromPadstsFixture({
    id: "copper-cutouts",
    fileName: "copper-cutouts.asc",
    expectedByteLength: 611,
    gitBlobSha: "b96381a87c1a56686b637d6a66ccf1fee288911a",
  }),
  fromPadstsFixture({
    id: "decal-graphics",
    fileName: "decal-graphics.asc",
    expectedByteLength: 1_615,
    gitBlobSha: "2749319525faec0653d00ca8585985df9aa7a40e",
  }),
  {
    id: "lcore2",
    fileName: "lcore2.asc",
    expectedByteLength: 158_111,
    gitBlobSha: "19c44a96bd991438042c2beebd22bb2f7e5331ab",
    downloadUrl: `https://raw.githubusercontent.com/KiCad/kicad-source-mirror/${KICAD_COMMIT}/${KICAD_PADS_ROOT}/LCORE_2.asc`,
    sourceUrl: `https://github.com/KiCad/kicad-source-mirror/blob/${KICAD_COMMIT}/${KICAD_PADS_ROOT}/LCORE_2.asc`,
    licenseUrl: `https://github.com/KiCad/kicad-source-mirror/blob/${KICAD_COMMIT}/${KICAD_PADS_ROOT}/LICENSE`,
  },
]

export const getTestAsset = (id: string): TestAsset => {
  const asset = testAssets.find((candidate) => candidate.id === id)
  if (!asset) throw new Error(`Unknown PADS test asset: ${id}`)
  return asset
}

export const getTestAssetPath = (asset: TestAsset): string =>
  resolve(testAssetDirectory, asset.fileName)

export const calculateGitBlobSha = (bytes: Uint8Array): string => {
  const hash = createHash("sha1")
  hash.update(`blob ${bytes.byteLength}\0`)
  hash.update(bytes)
  return hash.digest("hex")
}
