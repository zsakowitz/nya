import { FnDist } from "../../dist"
import { oklab } from "./oklab"

export const FN_OKLCH = new FnDist("oklch")
  .add(
    ["r32", "r32", "r32"],
    "color",
    () => {
      throw new Error("Cannot compute oklch() colors outside of shaders.")
    },
    (ctx, l, cr, hr) => {
      const h = ctx.name()
      ctx.push`float ${h} = ${hr.expr} / 360.0 * ${2 * Math.PI};\n`
      const c = ctx.name()
      ctx.push`float ${c} = ${cr.expr};\n`
      return oklab(
        ctx,
        l.expr,
        `(${c} * cos(${h}))`,
        `(${c} * sin(${h}))`,
        "1.0",
      )
    },
  )
  .add(
    ["r32", "r32", "r32", "r32"],
    "color",
    () => {
      throw new Error("Cannot compute oklch() colors outside of shaders.")
    },
    (ctx, l, cr, hr, a) => {
      const h = ctx.name()
      ctx.push`float ${h} = ${hr.expr} / 360.0 * ${2 * Math.PI};\n`
      const c = ctx.name()
      ctx.push`float ${c} = ${cr.expr};\n`
      return oklab(
        ctx,
        l.expr,
        `(${c} * cos(${h}))`,
        `(${c} * sin(${h}))`,
        a.expr,
      )
    },
  )
