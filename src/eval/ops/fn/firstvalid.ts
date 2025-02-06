import { FnDistVar } from "../dist"
import { TY_INFO } from "../../ty/info"
import { FN_VALID } from "./valid"

export const FN_FIRSTVALID = new FnDistVar(
  "firstvalid",
  "returns the first value which is valid for its type (the first finite number, the first color which is displayable, etc.)",
)
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
