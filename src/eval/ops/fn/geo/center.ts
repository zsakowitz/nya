import { FnDist } from "../../dist"

export const FN_CENTER = new FnDist("end", "gets the center of a circle").add(
  ["circle"],
  "point32",
  (a) => a.value.center,
  (_, a) => `${a.expr}.xy`,
)
