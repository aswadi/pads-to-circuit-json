import { mkdir } from "node:fs/promises"
import { relative } from "node:path"
import {
  calculateGitBlobSha,
  getTestAssetPath,
  type TestAsset,
  testAssetDirectory,
  testAssets,
} from "./test-assets"

const verifyAsset = (asset: TestAsset, bytes: Uint8Array): void => {
  if (bytes.byteLength !== asset.expectedByteLength) {
    throw new Error(
      `${asset.id}: expected ${asset.expectedByteLength} bytes, received ${bytes.byteLength}`,
    )
  }
  const actualSha = calculateGitBlobSha(bytes)
  if (actualSha !== asset.gitBlobSha) {
    throw new Error(
      `${asset.id}: expected Git blob ${asset.gitBlobSha}, received ${actualSha}`,
    )
  }
}

const downloadAsset = async (asset: TestAsset): Promise<void> => {
  const assetPath = getTestAssetPath(asset)
  const assetFile = Bun.file(assetPath)
  if (await assetFile.exists()) {
    verifyAsset(asset, await assetFile.bytes())
    console.log(`verified ${relative(process.cwd(), assetPath)}`)
    return
  }

  const response = await fetch(asset.downloadUrl)
  if (!response.ok) {
    throw new Error(
      `${asset.id}: download failed with ${response.status} ${response.statusText}`,
    )
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  verifyAsset(asset, bytes)
  await Bun.write(assetPath, bytes)
  console.log(`downloaded ${relative(process.cwd(), assetPath)}`)
}

await mkdir(testAssetDirectory, { recursive: true })
for (const asset of testAssets) await downloadAsset(asset)
