import { FnDist } from "../../dist"

export const FN_LINE = new FnDist("line").add(
  ["point32", "point32"],
  "line32",
  (a, b) => [a.value, b.value],
  (_, a, b) => `vec4(${a.expr}, ${b.expr})`,
)
