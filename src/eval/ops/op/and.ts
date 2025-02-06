import { FnDist } from "../dist"

export const OP_AND = new FnDist(
  "and",
  "returns true if both inputs are true",
).add(
  ["bool", "bool"],
  "bool",
  (a, b) => a.value && b.value,
  (_, a, b) => `(${a.expr} && ${b.expr})`,
)
