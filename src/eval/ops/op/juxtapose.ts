import { OP_CDOT } from "./mul"

export const OP_JUXTAPOSE = OP_CDOT.withName(
  "juxtapose",
  "multiplies two values which aren't separated by an operator",
).add(
  ["str", "str"],
  "str",
  (a, b) => [...a.value, ...b.value],
  () => {
    throw new Error("Text cannot be created in shaders.")
  },
)
