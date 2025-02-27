import { FnDist } from "../../../eval/ops/dist"
import { rept } from "../../../eval/ty/create"
import { crArcVal } from "../arc"

export const FN_CENTER = new FnDist("center", "gets the center of a circle")
  .add(
    ["circle"],
    "point32",
    (a) => a.value.center,
    (_, a) => `${a.expr}.xy`,
  )
  .add(
    ["arc"],
    "point32",
    (a) => rept(crArcVal(a.value).c),
    () => {
      // TODO:
      throw new Error("Cannot calculate the center of an arc in shaders yet.")
    },
  )
