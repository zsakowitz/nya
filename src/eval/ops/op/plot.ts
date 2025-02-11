import { FnDist } from "../dist"
import { FN_HSV } from "../fn/color/hsv"
import { FN_DEBUGPOINT } from "../fn/debugpoint"

export function plotJs(): never {
  throw new Error("Cannot plot colors outside of a shader.")
}

function bool(x: string) {
  return `(${x} ? vec4(vec3(0x2d, 0x70, 0xb3) / 255.0, 1) : vec4(0))`
}

export const OP_PLOT = new FnDist<"color">(
  "plot",
  "converts an expression to the color it plots as a shader",
)
  .add(["bool"], "color", plotJs, (_, a) => bool(a.expr))
  .add(
    ["r32"],
    "color",
    plotJs,
    (ctx, a) =>
      FN_HSV.glsl1(
        ctx,
        a,
        { type: "r32", expr: "1.0" },
        { type: "r32", expr: "1.0" },
      ).expr,
  )
  .add(
    ["point32"],
    "color",
    plotJs,
    (ctx, a) => FN_DEBUGPOINT.glsl1(ctx, a).expr,
  )
  .add(["color"], "color", plotJs, (_, a) => a.expr)
