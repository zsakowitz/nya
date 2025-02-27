import { FnDist } from "../../../eval/ops/dist"
import { real } from "../../../eval/ty/create"
import { crArcVal } from "../arc"

export const FN_RADIUS = new FnDist("radius", "measures the radius of a circle")
  .add(
    ["circle"],
    "r32",
    (a) => a.value.radius,
    (_, a) => `${a.expr}.z`,
  )
  .add(
    ["arc"],
    "r32",
    (a) => real(crArcVal(a.value).r),
    () => {
      // TODO:
      throw new Error("Cannot calculate the radius of an arc in shaders yet.")
    },
  )
