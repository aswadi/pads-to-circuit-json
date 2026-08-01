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
const KICAD_RAW_ROOT = `https://raw.githubusercontent.com/KiCad/kicad-source-mirror/${KICAD_COMMIT}`
const KICAD_BLOB_ROOT = `https://github.com/KiCad/kicad-source-mirror/blob/${KICAD_COMMIT}`
const KICAD_PADS_ROOT = "qa/data/pcbnew/plugins/pads"

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
    id: "keepout-test",
    fileName: "keepout-test.asc",
    expectedByteLength: 861,
    gitBlobSha: "3c8b85cd3b4c0cc391e5ca27410f1270cb442d7e",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/keepout_test.asc`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/keepout_test.asc`,
    licenseUrl: `${KICAD_BLOB_ROOT}/LICENSE`,
  },
  {
    id: "claysight",
    fileName: "claysight.asc",
    expectedByteLength: 79_802,
    gitBlobSha: "7d9c8c1d9ab223b17a37ef6be6e4d484dc0f9448",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/ClaySight_MK1/ClaySight_MK1.asc`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/ClaySight_MK1/ClaySight_MK1.asc`,
    licenseUrl: `${KICAD_BLOB_ROOT}/LICENSE`,
  },
  {
    id: "synthetic-multilayer",
    fileName: "synthetic-multilayer.asc",
    expectedByteLength: 1_079,
    gitBlobSha: "d7fedf81aacaae268308f5246241b13860b79bc6",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/synthetic_multilayer.asc`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/synthetic_multilayer.asc`,
    licenseUrl: `${KICAD_BLOB_ROOT}/LICENSE`,
  },
  {
    id: "lcore2",
    fileName: "lcore2.asc",
    expectedByteLength: 158_111,
    gitBlobSha: "19c44a96bd991438042c2beebd22bb2f7e5331ab",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/LCORE_2/LCORE_2.asc`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/LCORE_2/LCORE_2.asc`,
    licenseUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/LCORE_2/LICENSE`,
  },
  {
    id: "ems4-rev2",
    fileName: "ems4-rev2.asc",
    expectedByteLength: 1_028_182,
    gitBlobSha: "40e2b34db4db74783b27ebd0e36dbcc98bc0f76e",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/Ems4_Rev2/Ems4_Rev2.asc`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/Ems4_Rev2/Ems4_Rev2.asc`,
    licenseUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/Ems4_Rev2/LICENSE`,
  },
  {
    id: "dexter-motor-control",
    fileName: "dexter-motor-control.asc",
    expectedByteLength: 936_754,
    gitBlobSha: "a095b6257cb6977a2f6eb0b9421c261e425accec",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/Dexter_MotorCtrl/Dexter_MotorCtrl.asc`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/Dexter_MotorCtrl/Dexter_MotorCtrl.asc`,
    licenseUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/Dexter_MotorCtrl/LICENSE`,
  },
  {
    id: "dexter-native-v2021",
    fileName: "dexter-native-v2021.pcb",
    expectedByteLength: 944_042,
    gitBlobSha: "de19ddaccb97ed48b0f2947957566f8133c45ed4",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/Dexter_MotorCtrl/Dexter_MotorCtrl.pcb`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/Dexter_MotorCtrl/Dexter_MotorCtrl.pcb`,
    licenseUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/Dexter_MotorCtrl/LICENSE`,
  },
  {
    id: "ems4-native-v2025",
    fileName: "ems4-native-v2025.pcb",
    expectedByteLength: 1_407_741,
    gitBlobSha: "b3241d625e1087736c5941413506119637e5b516",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/Ems4_Rev2/Ems4_Rev2.pcb`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/Ems4_Rev2/Ems4_Rev2.pcb`,
    licenseUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/Ems4_Rev2/LICENSE`,
  },
  {
    id: "lcore2-native-v2026",
    fileName: "lcore2-native-v2026.pcb",
    expectedByteLength: 253_744,
    gitBlobSha: "c2962ad1c6356e4fe9fd6a78efd0c012821c312f",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/LCORE_2/LCORE_2.pcb`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/LCORE_2/LCORE_2.pcb`,
    licenseUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/LCORE_2/LICENSE`,
  },
  {
    id: "tms1mmx19-native-v2027",
    fileName: "tms1mmx19-native-v2027.pcb",
    expectedByteLength: 911_147,
    gitBlobSha: "56cc3347b3ff0b99582193aceda46e4fb2c6290d",
    downloadUrl: `${KICAD_RAW_ROOT}/${KICAD_PADS_ROOT}/TMS1mmX19/TMS1mmX19.pcb`,
    sourceUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/TMS1mmX19/TMS1mmX19.pcb`,
    licenseUrl: `${KICAD_BLOB_ROOT}/${KICAD_PADS_ROOT}/TMS1mmX19/LICENSE`,
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
