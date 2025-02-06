import { pt } from "../../../ty/create"
import { FnDist } from "../../dist"
import { abs, abs64 } from "../../op/abs"

export const FN_UNSIGN = new FnDist(
  "unsign",
  "takes the absolute value of the components of a value",
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
  .add(
    ["point64"],
    "point64",
    (a) => pt(abs(a.value.x), abs(a.value.y)),
    (ctx, a) => {
      const name = ctx.cache(a)
      return `vec4(${abs64(ctx, `${name}.xy`)}, ${abs64(ctx, `${name}.zw`)})`
    },
  )
  .add(
    ["point32"],
    "point32",
    (a) => pt(abs(a.value.x), abs(a.value.y)),
    (_, a) => `abs(${a.expr})`,
  )
