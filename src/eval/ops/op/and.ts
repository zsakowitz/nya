import { FnDist } from "../../fn/dist"

export const OP_AND = new FnDist("and").add(
  ["bool", "bool"],
  "bool",
  (a, b) => a.value && b.value,
  (_, a, b) => `(${a.expr} && ${b.expr})`,
)
