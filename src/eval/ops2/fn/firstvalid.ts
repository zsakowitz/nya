import { FnDistVar } from "../../fn/dist"
import { TY_INFO } from "../../ty2/info"
import { FN_VALID } from "./valid"

export const FN_FIRSTVALID = new FnDistVar("firstvalid")
  .add(
    ["color"],
    "color",
    (a) => (FN_VALID.js1(a).value ? a.value : TY_INFO.color.garbage.js),
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `${FN_VALID.glsl1(ctx, { type: "color", expr: a }).expr} ? ${a} : ${TY_INFO.color.garbage.glsl}`
    },
  )
  .add(
    ["color", "color"],
    "color",
    (a, b) =>
      FN_VALID.js1(a).value ? a.value
      : FN_VALID.js1(b).value ? b.value
      : TY_INFO.color.garbage.js,
    (ctx, ar, br) => {
      const a = ctx.cache(ar)
      const b = ctx.cache(br)
      return `${FN_VALID.glsl1(ctx, { type: "color", expr: a }).expr} ? ${a} : ${FN_VALID.glsl1(ctx, { type: "color", expr: b }).expr} ? ${b} : ${TY_INFO.color.garbage.glsl}`
    },
  )
