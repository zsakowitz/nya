import { FnDist } from "../dist"

export const OP_OR = new FnDist(
  "or",
  "returns true if either of its inputs are true",
).add(
  ["bool", "bool"],
  "bool",
  (a, b) => a.value || b.value,
  (_, a, b) => `(${a.expr} || ${b.expr})`,
)
