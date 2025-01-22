import { FnDist } from "../dist"
import { FN_HSV } from "../fn/color/hsv"
import { FN_DEBUGPOINT } from "../fn/debugpoint"
import { FN_SCREENDISTANCE } from "../fn/screendistance"

function err(): never {
  throw new Error("Cannot plot colors outside of a shader.")
}

function bool(x: string) {
  return `(${x} ? vec4(vec3(0x2d, 0x70, 0xb3) / 255.0, 1.0) : vec4(0))`
}

export const OP_PLOT = new FnDist<"color">("plot")
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
    return bool(
      `distance(v_coords.xz, ${a}.xy) * u_px_per_unit.x >= ${a}.z * u_px_per_unit.x - 2. && distance(v_coords.xz, ${a}.xy) * u_px_per_unit.x <= ${a}.z * u_px_per_unit.x + 2.`,
    )
  })
  .add(["line32"], "color", err, (ctx, raw) => {
    const a = ctx.cache(raw)
    const ax = `${a}.x`
    const ay = `${a}.y`
    const bx = `${a}.z`
    const by = `${a}.w`
    const px = `v_coords.x`
    const py = `v_coords.z`
    const x = ctx.cache({
      type: "r32",
      expr: `
(
  (
    (${py} - ${ay}) * (${bx} - ${ax}) * (${by} - ${ay})
      + ${ax} * (${by} - ${ay}) * (${by} - ${ay})
      + ${px} * (${bx} - ${ax}) * (${bx} - ${ax})
  ) / (
    (${by} - ${ay}) * (${by} - ${ay})
      + (${bx} - ${ax}) * (${bx} - ${ax})
  )
)`,
    })
    const y = ctx.cache({
      type: "r32",
      expr: `((${x} - ${ax}) * ((${by} - ${ay}) / (${bx} - ${ax})) + ${ay})`,
    })
    const dist = ctx.cache(
      FN_SCREENDISTANCE.glsl1(
        ctx,
        {
          type: "c32",
          expr: `vec2(${x}, ${y})`,
        },
        {
          type: "c32",
          expr: `v_coords.xz`,
        },
      ),
    )
    return bool(`${dist} < 2.`)
  })
