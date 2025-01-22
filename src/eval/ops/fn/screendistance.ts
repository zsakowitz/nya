import { FnDist } from "../dist"

export const FN_SCREENDISTANCE = new FnDist("screendistance").add(
  ["c32", "c32"],
  "r32",
  () => {
    throw new Error("Cannot calculate screendistance outside of shaders.")
  },
  (_, a, b) => {
    return `length((${a.expr} - ${b.expr}) * u_px_size.xz)`
  },
)
