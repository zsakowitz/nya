import { FnDist } from "@/eval/ops/dist"

export const FN_RAY = new FnDist(
  "ray",
  "constructs a ray (a line going in a particular direction)",
).add(
  ["point32", "point32"],
  "ray",
  (a, b) => [a.value, b.value],
  (_, a, b) => `vec4(${a.expr}, ${b.expr})`,
)
