import { FnDist } from "../../fn/dist"
import { approx, num } from "../../ty/create"

export const OP_DIV = new FnDist("/").add(
  ["r32", "r32"],
  "r32",
  (a, b) => approx(num(a.value) / num(b.value)),
  (_, a, b) => `(${a.expr} / ${b.expr})`,
)
