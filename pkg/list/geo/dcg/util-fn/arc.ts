import { FnDist } from "@/eval/ops/dist"

export const FN_ARC = new FnDist(
  "arc",
  "constructs an arc from three points",
).add(
  ["point32", "point32", "point32"],
  "arc",
  (a, b, c) => [a.value, b.value, c.value],
  (_, a, b, c) => `mat3x2(${a.expr}, ${b.expr}, ${c.expr})`,
  "arc((2,3),(9,-10),(1,5))",
)
