import { FnDist } from "../../dist"
import { FN_DEBUGPOINT } from "../debugpoint"
import { FN_HSV } from "./hsv"

function err(): never {
  throw new Error("Cannot plot colors outside of a shader.")
}

function bool(x: string) {
  return `(${x} ? vec4(vec3(0x2d, 0x70, 0xb3) / 255.0, 1.0) : vec4(0))`
}

export const FN_INTOCOLOR = new FnDist<"color">("intocolor")
  .add(["bool"], "color", err, (_, a) => bool(a.expr))
  .add(["color"], "color", err, (_, a) => a.expr)
  .add(
    ["r32"],
    "color",
    err,
    (ctx, a) =>
      FN_HSV.glsl1(
        ctx,
        a,
        { type: "r32", expr: "1.0" },
        { type: "r32", expr: "1.0" },
      ).expr,
  )
  .add(["c32"], "color", err, (ctx, a) => FN_DEBUGPOINT.glsl1(ctx, a).expr)
  .add(["point32"], "color", err, (ctx, a) => FN_DEBUGPOINT.glsl1(ctx, a).expr)
  .add(["circle32"], "color", err, (ctx, ar) => {
    const a = ctx.cache(ar)
    return bool(`distance(v_coords.xz, ${a}.xy) <= ${a}.z`)
  })
