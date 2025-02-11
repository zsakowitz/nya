import { approx, num } from "../../../ty/create"
import { FnDist } from "../../dist"

export const FN_COS = new FnDist("cos", "takes the cosine of an angle").add(
  ["r32"],
  "r32",
  (a) => approx(Math.cos(num(a.value))),
  (_, a) => `cos(${a.expr})`,
)
