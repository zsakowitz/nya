import type { GlslContext } from "../../../../eval/lib/fn"
import { FnDist } from "../../../../eval/ops/dist"
import type {
  GlslVal,
  JsVal,
  SPoint,
  SReal,
  TyName,
  Val,
} from "../../../../eval/ty"
import { pt } from "../../../../eval/ty/create"
import { add, mul, sub } from "../../../../eval/ty/ops"

interface DilationJs {
  c: SPoint
  s: SReal
}

interface DilationGlsl {
  by: string
}

export function dilateJs(by: DilationJs, target: SPoint) {
  const x = sub(target.x, by.c.x)
  const y = sub(target.y, by.c.y)

  return pt(add(mul(x, by.s), by.c.x), add(mul(y, by.s), by.c.y))
}

function dilateGlsl(ctx: GlslContext, by: DilationGlsl, target: string) {
  ctx.glsl`vec2 _helper_dilate(vec3 by, vec2 target) {
  target -= by;
  return vec2(
    target.x * by.z - target.x * by.w,
    target.y * by.z + target.y * by.w,
  ) + by.xy;
}
`

  return `_helper_dilate(${by}, ${target})`
}

export const FN_DILATE = new FnDist(
  "dilate",
  "scales an object from some point by some scaling factor",
)

mark(
  "point32",
  (a, b) => dilateJs(b, a.value),
  (ctx, a, b) => dilateGlsl(ctx, b, a.expr),
)

mark(
  "segment",
  (a, b) => [dilateJs(b, a.value[0]), dilateJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${dilateGlsl(ctx, b, `${a}.xy`)}, ${dilateGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "ray",
  (a, b) => [dilateJs(b, a.value[0]), dilateJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${dilateGlsl(ctx, b, `${a}.xy`)}, ${dilateGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "line",
  (a, b) => [dilateJs(b, a.value[0]), dilateJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${dilateGlsl(ctx, b, `${a}.xy`)}, ${dilateGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "vector",
  (a, b) => [dilateJs(b, a.value[0]), dilateJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${dilateGlsl(ctx, b, `${a}.xy`)}, ${dilateGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "circle",
  (a, b) => ({
    center: dilateJs(b, a.value.center),
    radius: a.value.radius,
  }),
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec3(${dilateGlsl(ctx, b, `${a}.xy`)}, ${a}.z)`
  },
)

mark(
  "arc",
  (a, b) => [
    dilateJs(b, a.value[0]),
    dilateJs(b, a.value[1]),
    dilateJs(b, a.value[2]),
  ],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `mat3x2(${dilateGlsl(ctx, b, `${a}[0]`)}, ${dilateGlsl(ctx, b, `${a}[1]`)}, ${dilateGlsl(ctx, b, `${a}[2]`)})`
  },
)

mark(
  "polygon",
  (a, b) => a.value.map((x) => dilateJs(b, x)),
  () => {
    throw new Error("Cannot construct polygons in shaders yet.")
  },
)

mark(
  "angle",
  (a, b) => [
    dilateJs(b, a.value[0]),
    dilateJs(b, a.value[1]),
    dilateJs(b, a.value[2]),
  ],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `mat3x2(${dilateGlsl(ctx, b, `${a}[0]`)}, ${dilateGlsl(ctx, b, `${a}[1]`)}, ${dilateGlsl(ctx, b, `${a}[2]`)})`
  },
)

mark(
  "directedangle",
  (a, b) => [
    dilateJs(b, a.value[0]),
    dilateJs(b, a.value[1]),
    dilateJs(b, a.value[2]),
  ],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `mat3x2(${dilateGlsl(ctx, b, `${a}[0]`)}, ${dilateGlsl(ctx, b, `${a}[1]`)}, ${dilateGlsl(ctx, b, `${a}[2]`)})`
  },
)

export function mark<const T extends TyName>(
  param: T,
  js: (arg: JsVal<T>, rotation: DilationJs) => Val<T>,
  glsl: (ctx: GlslContext, arg: GlslVal<T>, rotation: DilationGlsl) => string,
) {
  FN_DILATE.add(
    [param, "point32", "r32"],
    param,
    (a, b, c) => js(a, { c: b.value, s: c.value }),
    (ctx, a, b, c) => {
      return glsl(ctx, a, {
        by: ctx.cachedNative("vec3", `vec3(${b.expr}, ${c.expr})`),
      })
    },
  )
}
