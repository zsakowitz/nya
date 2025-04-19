import { FnDist } from "@/eval/ops/dist"
import { crArcVal } from "../util-arc"

export const FN_CENTER = new FnDist("center", "gets the center of a circle")
  .add(
    ["circle"],
    "point32",
    (a) => a.value.center,
    (_, a) => `${a.expr}.xy`,
    "center(circle((2,5),(4,3)))=(2,5)",
  )
  .add(
    ["arc"],
    "point32",
    (a) => crArcVal(a.value).c.s(),
    () => {
      // TODO:
      throw new Error("Cannot calculate the center of an arc in shaders yet.")
    },
    String.raw`center(\operatorname{arc}\left(\left(-6,4\right),\left(3,2\right),\left(0,5\right)\right))≈(-2.2143,-0.2143)`,
  )
