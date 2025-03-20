import { FnDist } from "../../../../eval/ops/dist"
import { pt, real } from "../../../../eval/ty/create"
import { add, sub } from "../../../../eval/ty/ops"
import { hypot } from "./distance"

export const FN_PERIMETER = new FnDist(
  "perimeter",
  "measures the perimeter of a polygon",
).add(
  ["polygon"],
  "r32",
  (a) => {
    if (a.value.length <= 1) {
      return real(0)
    }

    let ret = real(0)
    for (let i = 0; i < a.value.length; i++) {
      const self = a.value[i]!
      const next = a.value[(i + 1) % a.value.length]!
      ret = add(ret, hypot(pt(sub(self.x, next.x), sub(self.y, next.y))))
    }

    return ret
  },
  () => {
    throw new Error("Cannot measure polygon perimeters in shaders.")
  },
)
