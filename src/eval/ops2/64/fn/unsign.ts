import { FnDist } from "../../../fn/dist"
import { pt } from "../../../ty/create"
import { abs, abs64 } from "../op/abs"

export const FN_UNSIGN = new FnDist("unsign")
  .add(
    ["r64"],
    "r64",
    (a) => abs(a.value),
    (ctx, a) => abs64(ctx, a.expr),
  )
  .add(
    ["r32"],
    "r32",
    (a) => abs(a.value),
    (_, a) => `abs(${a.expr})`,
  )
  .add(
    ["c64"],
    "c64",
    (a) => pt(abs(a.value.x), abs(a.value.y)),
    (ctx, a) => {
      const name = ctx.cache(a)
      return `vec4(${abs64(ctx, `${name}.xy`)}, ${abs64(ctx, `${name}.zw`)})`
    },
  )
  .add(
    ["c32"],
    "c32",
    (a) => pt(abs(a.value.x), abs(a.value.y)),
    (_, a) => `abs(${a.expr})`,
  )
