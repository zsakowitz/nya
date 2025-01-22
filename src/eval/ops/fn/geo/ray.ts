import { FnDist } from "../../dist"

export const FN_RAY = new FnDist("ray").add(
  ["point32", "point32"],
  "ray32",
  (a, b) => [a.value, b.value],
  (_, a, b) => `vec4(${a.expr}, ${b.expr})`,
)
