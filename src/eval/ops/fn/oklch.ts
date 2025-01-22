import { FnDist } from "../dist"
import { oklab } from "./oklab"

export const FN_OKLCH = new FnDist("oklch").add(
  ["r32", "r32", "r32"],
  "color",
  () => {
    throw new Error("Cannot compute oklch() colors outside of shaders.")
  },
  (ctx, l, c, h) => {
    const hname = ctx.name()
    ctx.push`float ${hname} = ${h.expr} / 360.0 * ${2 * Math.PI};\n`
    const cname = ctx.name()
    ctx.push`float ${cname} = ${c.expr};\n`
    return oklab(
      ctx,
      l.expr,
      `(${cname} * cos(${hname}))`,
      `(${cname} * sin(${hname}))`,
    )
  },
)
