import { FnDist } from "../dist"
import { FN_HSV } from "../fn/color/hsv"
import { FN_DEBUGPOINT } from "../fn/debugpoint"
import { FN_DISTANCE } from "../fn/geo/distance"

function err(): never {
  throw new Error("Cannot plot colors outside of a shader.")
}

function bool(x: string) {
  return `(${x} ? vec4(vec3(0x2d, 0x70, 0xb3) / 255.0, 1) : vec4(0))`
}

export const OP_PLOT = new FnDist<"color">(
  "plot",
  "converts an expression to the color it plots as a shader",
)
  .add(["bool"], "color", err, (_, a) => bool(a.expr))
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
  .add(["color"], "color", err, (_, a) => a.expr)
  .add(["line"], "color", err, (ctx, a) =>
    bool(
      `${FN_DISTANCE.glsl1(ctx, a, { type: "point32", expr: "v_coords.xz" }).expr} < 2. / u_px_per_unit.x`,
    ),
  )
  .add(["circle"], "color", err, (ctx, ar) => {
    const a = ctx.cache(ar)
    return bool(
      `distance(v_coords.xz, ${a}.xy) * u_px_per_unit.x >= ${a}.z * u_px_per_unit.x - 2. && distance(v_coords.xz, ${a}.xy) * u_px_per_unit.x <= ${a}.z * u_px_per_unit.x + 2.`,
    )
  })
