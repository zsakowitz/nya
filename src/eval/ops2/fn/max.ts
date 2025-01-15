import { FnDist } from "../../fn/dist"
import { num } from "../../ty/create"

export const MAX = new FnDist("max").add(
  ["r32", "r32"],
  "r32",
  (a, b) => (num(b.value) > num(a.value) ? b.value : a.value),
  (_, a, b) => `max(${a.expr}, ${b.expr})`,
)
