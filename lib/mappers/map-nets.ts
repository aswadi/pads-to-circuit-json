import type { AnyCircuitElement } from "circuit-json"
import type { ConversionContext } from "../internal/conversion-context"
import { toStableCircuitJsonId } from "../internal/coordinates"

export const mapNets = (context: ConversionContext): void => {
  const netNames = new Set<string>()
  for (const path of context.geometry.paths) {
    if (path.netName) netNames.add(path.netName)
  }
  for (const circle of context.geometry.circles) {
    if (circle.netName) netNames.add(circle.netName)
  }
  for (const pad of context.geometry.pads) {
    if (pad.netName) netNames.add(pad.netName)
  }
  for (const hole of context.geometry.holes) {
    if (hole.netName) netNames.add(hole.netName)
  }

  for (const [index, netName] of [...netNames].sort().entries()) {
    const sourceNetId = toStableCircuitJsonId("source_net", netName, index)
    const pcbNetId = toStableCircuitJsonId("pcb_net", netName, index)
    context.sourceNetIdByName.set(netName, sourceNetId)
    context.circuitJson.push(
      {
        type: "source_net",
        source_net_id: sourceNetId,
        name: netName,
        member_source_group_ids: [],
      } as AnyCircuitElement,
      {
        type: "pcb_net",
        pcb_net_id: pcbNetId,
        source_net_id: sourceNetId,
      } as AnyCircuitElement,
    )
  }
}
