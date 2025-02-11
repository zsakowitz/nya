import { approx, num } from "../../../ty/create"
import { FnDist } from "../../dist"

export const FN_TAN = new FnDist("tan", "takes the tangent of an angle").add(
  ["r32"],
  "r32",
  (a) => approx(Math.tan(num(a.value))),
  (_, a) => `tan(${a.expr})`,
)
