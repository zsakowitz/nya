import { FnDist } from "../../dist"

export const FN_VECTOR = new FnDist(
  "vector",
  "constructs a vector between two points",
).add(
  ["point32", "point32"],
  "vector32",
  (a, b) => [a.value, b.value],
  (_, a, b) => `vec4(${a.expr}, ${b.expr})`,
)
