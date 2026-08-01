import type { PadsToCircuitJsonProgressStage } from "./types"

export class PadsToCircuitJsonAbortError extends Error {
  readonly stage: PadsToCircuitJsonProgressStage

  constructor(stage: PadsToCircuitJsonProgressStage) {
    super(`PADS to Circuit JSON conversion aborted during ${stage}`)
    this.name = "AbortError"
    this.stage = stage
  }
}
