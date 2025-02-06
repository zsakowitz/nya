import { isDark } from "../../../../sheet/theme"
import { frac } from "../../../ty/create"
import { FnDist } from "../../dist"
import { sub } from "../../op/sub"

export const FN_INVERTDARK = new FnDist("invertdark").add(
  ["color"],
  "color",
  (a) => {
    if (isDark()) {
      return {
        type: "color",
        r: sub(frac(255, 0), a.value.r),
        g: sub(frac(255, 0), a.value.g),
        b: sub(frac(255, 0), a.value.b),
        a: a.value.a,
      }
    } else return a.value
  },
  (ctx, ar) => {
    const a = ctx.cache(ar)
    return `(u_darkmul * ${a} + u_darkoffset)`
  },
)
