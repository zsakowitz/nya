import { FnDist } from "../dist"

export const FN_SCREENDISTANCE = new FnDist<"r32">(
  "screendistance",
  "calculates the distance between two points in terms of pixels on your screen, rather than graphpaper units",
).add(
  ["c32", "c32"],
  "r32",
  () => {
    throw new Error("Cannot calculate screendistance outside of shaders.")
  },
  (_, a, b) => {
    return `length((${a.expr} - ${b.expr}) * u_px_per_unit.xz)`
  },
)
