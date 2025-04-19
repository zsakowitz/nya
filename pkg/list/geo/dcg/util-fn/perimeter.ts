import { FnDist } from "@/eval/ops/dist"
import { int } from "@/lib/real"

export const FN_PERIMETER = new FnDist(
  "perimeter",
  "measures the perimeter of a polygon",
).add(
  ["polygon"],
  "r32",
  (a) => {
    if (a.value.length <= 1) {
      return int(0)
    }

    let ret = int(0)
    for (let i = 0; i < a.value.length; i++) {
      const self = a.value[i]!
      const next = a.value[(i + 1) % a.value.length]!
      ret = self.sub(next).hypot().add(ret)
    }

    return ret
  },
  () => {
    throw new Error("Cannot measure polygon perimeters in shaders.")
  },
  "perimeter(polygon((2,3),(7,5),(-1,4)))≈16.6097",
)
