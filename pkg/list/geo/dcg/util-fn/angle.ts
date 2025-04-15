import { FnDist } from "@/eval/ops/dist"

export const FN_ANGLE = new FnDist(
  "angle",
  "constructs an angle from three vertices",
).add(
  ["point32", "point32", "point32"],
  "angle",
  (a, b, c) => [a.value, b.value, c.value],
  (_, a, b, c) => `mat3x2(${a.expr}, ${b.expr}, ${c.expr})`,
  "angle((7,0),(5,4),(2,3))",
)

export const FN_DIRECTEDANGLE = new FnDist(
  "directedangle",
  "constructs an angle with a particular direction",
).add(
  ["point32", "point32", "point32"],
  "directedangle",
  (a, b, c) => [a.value, b.value, c.value],
  (_, a, b, c) => `mat3x2(${a.expr}, ${b.expr}, ${c.expr})`,
  "directedangle((7,0),(5,4),(2,3))",
)
