import { FnDistVar } from "../dist"
import { num } from "../../ty/create"

export const FN_MAX = new FnDistVar(
  "max",
  "returns the maximum of its inputs",
).add(
  ["r32", "r32"],
  "r32",
  (a, b) => (num(b.value) > num(a.value) ? b.value : a.value),
  (_, a, b) => `max(${a.expr}, ${b.expr})`,
)
