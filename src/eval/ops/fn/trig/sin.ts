import { approx, num } from "../../../ty/create"
import { FnDist } from "../../dist"

export const FN_SIN = new FnDist("sin", "takes the sine of an angle").add(
  ["r32"],
  "r32",
  (a) => approx(Math.sin(num(a.value))),
  (_, a) => `sin(${a.expr})`,
)
