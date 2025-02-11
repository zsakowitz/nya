import { FnDist } from "../../../eval/ops/dist"

export const FN_LINE = new FnDist(
  "line",
  "constructs a line between two points",
).add(
  ["point32", "point32"],
  "line",
  (a, b) => [a.value, b.value],
  (_, a, b) => `vec4(${a.expr}, ${b.expr})`,
)
