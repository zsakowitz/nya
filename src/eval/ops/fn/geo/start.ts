import { FnDist } from "../../dist"

export const FN_START = new FnDist(
  "start",
  "gets the starting point of a vector",
).add(
  ["vector"],
  "point32",
  (a) => a.value[0],
  (_, a) => `${a.expr}.xy`,
)
