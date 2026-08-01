import type { DeepReadonly } from "../../lib"

export const deepFreeze = <Value>(value: Value): DeepReadonly<Value> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value as DeepReadonly<Value>
}
