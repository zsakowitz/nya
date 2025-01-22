import { FnDistVar } from "../dist"
import { num } from "../../ty/create"

export const FN_MIN = new FnDistVar("min").add(
  ["r32", "r32"],
  "r32",
  (a, b) => (num(b.value) < num(a.value) ? b.value : a.value),
  (_, a, b) => `min(${a.expr}, ${b.expr})`,
)
