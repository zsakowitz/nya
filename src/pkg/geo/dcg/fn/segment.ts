import { FnDist } from "@/eval/ops/dist"

export const FN_SEGMENT = new FnDist(
  "segment",
  "constructs a line segment",
).add(
  ["point32", "point32"],
  "segment",
  (a, b) => [a.value, b.value],
  (_, a, b) => `vec4(${a.expr}, ${b.expr})`,
  "segment((7,8),(2,-3))",
)
