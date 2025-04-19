import { FnDist } from "@/eval/ops/dist"
import { crArcVal } from "../util-arc"

export const FN_RADIUS = new FnDist("radius", "measures the radius of a circle")
  .add(
    ["circle"],
    "r32",
    (a) => a.value.radius,
    (_, a) => `${a.expr}.z`,
    "radius(circle((2,5),(4,3)))≈2.8284",
  )
  .add(
    ["arc"],
    "r32",
    (a) => real(crArcVal(a.value).r),
    () => {
      // TODO:
      throw new Error("Cannot calculate the radius of an arc in shaders yet.")
    },
    String.raw`radius(\operatorname{arc}\left(\left(-6,4\right),\left(3,2\right),\left(0,5\right)\right))≈5.6650`,
  )
