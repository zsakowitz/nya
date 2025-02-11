import { FnDist } from "../../../eval/ops/dist"

export const FN_RADIUS = new FnDist(
  "end",
  "measures the radius of a circle",
).add(
  ["circle"],
  "r32",
  (a) => a.value.radius,
  (_, a) => `${a.expr}.z`,
)
