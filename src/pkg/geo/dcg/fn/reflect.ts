import type { GlslContext } from "../../../../eval/lib/fn"
import { FnDist } from "../../../../eval/ops/dist"
import type { GlslVal, JsVal, SPoint, TyName, Val } from "../../../../eval/ty"
import { frac, pt } from "../../../../eval/ty/create"
import { mul, sub } from "../../../../eval/ty/ops"
import { intersectSLineLineJs } from "./intersection"
import { perpendicularJs } from "./perpendicular"

interface ReflectionJs {
  value: Val<"line">
}

interface ReflectionGlsl {
  by: string
}

export function reflectJs(by: ReflectionJs, target: SPoint) {
  const p = perpendicularJs(by, { value: target })
  const i = intersectSLineLineJs(p, by.value)

  return pt(
    sub(mul(frac(2, 1), i.x), target.x),
    sub(mul(frac(2, 1), i.y), target.y),
  )
}

function reflectGlsl(ctx: GlslContext, by: ReflectionGlsl, target: string) {
  throw new Error("Cannot call 'reflect' in shaders yet.")

  ctx.glsl`vec2 _helper_reflect(vec3 by, vec2 target) {
  target -= by;
  return vec2(
    target.x * by.z - target.x * by.w,
    target.y * by.z + target.y * by.w,
  ) + by.xy;
}
`

  return `_helper_reflect(${by}, ${target})`
}

export const FN_REFLECT = new FnDist(
  "reflect",
  "reflects an object across a line",
)

mark(
  "point32",
  (a, b) => reflectJs(b, a.value),
  (ctx, a, b) => reflectGlsl(ctx, b, a.expr),
)

mark(
  "segment",
  (a, b) => [reflectJs(b, a.value[0]), reflectJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${reflectGlsl(ctx, b, `${a}.xy`)}, ${reflectGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "ray",
  (a, b) => [reflectJs(b, a.value[0]), reflectJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${reflectGlsl(ctx, b, `${a}.xy`)}, ${reflectGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "line",
  (a, b) => [reflectJs(b, a.value[0]), reflectJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${reflectGlsl(ctx, b, `${a}.xy`)}, ${reflectGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "vector",
  (a, b) => [reflectJs(b, a.value[0]), reflectJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${reflectGlsl(ctx, b, `${a}.xy`)}, ${reflectGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "circle",
  (a, b) => ({
    center: reflectJs(b, a.value.center),
    radius: a.value.radius,
  }),
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec3(${reflectGlsl(ctx, b, `${a}.xy`)}, ${a}.z)`
  },
)

mark(
  "arc",
  (a, b) => [
    reflectJs(b, a.value[0]),
    reflectJs(b, a.value[1]),
    reflectJs(b, a.value[2]),
  ],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `mat3x2(${reflectGlsl(ctx, b, `${a}[0]`)}, ${reflectGlsl(ctx, b, `${a}[1]`)}, ${reflectGlsl(ctx, b, `${a}[2]`)})`
  },
)

mark(
  "polygon",
  (a, b) => a.value.map((x) => reflectJs(b, x)),
  () => {
    throw new Error("Cannot construct polygons in shaders yet.")
  },
)

mark(
  "angle",
  (a, b) => [
    reflectJs(b, a.value[0]),
    reflectJs(b, a.value[1]),
    reflectJs(b, a.value[2]),
  ],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `mat3x2(${reflectGlsl(ctx, b, `${a}[0]`)}, ${reflectGlsl(ctx, b, `${a}[1]`)}, ${reflectGlsl(ctx, b, `${a}[2]`)})`
  },
)

mark(
  "directedangle",
  (a, b) => [
    reflectJs(b, a.value[0]),
    reflectJs(b, a.value[1]),
    reflectJs(b, a.value[2]),
  ],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `mat3x2(${reflectGlsl(ctx, b, `${a}[0]`)}, ${reflectGlsl(ctx, b, `${a}[1]`)}, ${reflectGlsl(ctx, b, `${a}[2]`)})`
  },
)

export function mark<const T extends TyName>(
  param: T,
  js: (arg: JsVal<T>, rotation: ReflectionJs) => Val<T>,
  glsl: (ctx: GlslContext, arg: GlslVal<T>, rotation: ReflectionGlsl) => string,
) {
  FN_REFLECT.add(
    [param, "segment"],
    param,
    (a, b) => js(a, b),
    (ctx, a, br) => glsl(ctx, a, { by: ctx.cache(br) }),
  )

  FN_REFLECT.add(
    [param, "ray"],
    param,
    (a, b) => js(a, b),
    (ctx, a, br) => glsl(ctx, a, { by: ctx.cache(br) }),
    1,
  )

  FN_REFLECT.add(
    [param, "line"],
    param,
    (a, b) => js(a, b),
    (ctx, a, br) => glsl(ctx, a, { by: ctx.cache(br) }),
    2,
  )
}
