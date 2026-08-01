import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import { parsePads } from "padsts"
import { convertPadsToCircuitJson } from "../../lib"
import {
  calculateGitBlobSha,
  getTestAsset,
  getTestAssetPath,
} from "../../scripts/test-assets"

export const loadTestCase = async (id: string) => {
  const asset = getTestAsset(id)
  const assetPath = getTestAssetPath(asset)
  const assetFile = Bun.file(assetPath)
  if (!(await assetFile.exists())) {
    throw new Error(
      `Missing ${asset.fileName}; run bun run test:download-assets first`,
    )
  }

  const bytes = await assetFile.bytes()
  if (bytes.byteLength !== asset.expectedByteLength) {
    throw new Error(`${asset.fileName} has an unexpected byte length`)
  }
  if (calculateGitBlobSha(bytes) !== asset.gitBlobSha) {
    throw new Error(`${asset.fileName} failed its pinned Git blob check`)
  }

  const document = parsePads(bytes)
  const conversion = convertPadsToCircuitJson(document)
  const circuitJson = conversion.circuitJson.map((element, index) => {
    const result = any_circuit_element.safeParse(element)
    if (!result.success) {
      throw new Error(
        `${asset.fileName} element ${index} (${element.type}) failed Circuit JSON validation: ${result.error.message}`,
      )
    }
    return result.data as AnyCircuitElement
  })

  return { asset, bytes, document, conversion, circuitJson }
}
