import { FnDist } from "../../dist"

export const FN_END = new FnDist(
  "end",
  "gets the ending point of a vector",
).add(
  ["vector"],
  "point32",
  (a) => a.value[1],
  (_, a) => `${a.expr}.zw`,
)
