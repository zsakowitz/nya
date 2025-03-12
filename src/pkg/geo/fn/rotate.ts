import type { GlslContext } from "../../../eval/lib/fn"
import { FnDist } from "../../../eval/ops/dist"
import type {
  GlslVal,
  JsVal,
  SPoint,
  SReal,
  TyName,
  Val,
} from "../../../eval/ty"
import { num, pt, real } from "../../../eval/ty/create"
import { add, mul, sub } from "../../../eval/ty/ops"

interface RotationJs {
  c: SPoint
  cos: SReal
  sin: SReal
}

interface RotationGlsl {
  by: string
}

export function rotateJs(by: RotationJs, target: SPoint) {
  const x = sub(target.x, by.c.x)
  const y = sub(target.y, by.c.y)

  return pt(
    add(sub(mul(x, by.cos), mul(y, by.sin)), by.c.x),
    add(add(mul(y, by.cos), mul(x, by.sin)), by.c.y),
  )
}

function rotateGlsl(ctx: GlslContext, by: RotationGlsl, target: string) {
  ctx.glsl`vec2 _helper_rotate(vec4 by, vec2 target) {
  target -= by;
  return vec2(
    target.x * by.z - target.x * by.w,
    target.y * by.z + target.y * by.w,
  ) + by.xy;
}
`

  return `_helper_rotate(${by}, ${target})`
}

export const FN_ROTATE = new FnDist(
  "rotate",
  "rotates an object around a point by some angle",
)

mark(
  "point32",
  (a, b) => rotateJs(b, a.value),
  (ctx, a, b) => rotateGlsl(ctx, b, a.expr),
)

mark(
  "segment",
  (a, b) => [rotateJs(b, a.value[0]), rotateJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${rotateGlsl(ctx, b, `${a}.xy`)}, ${rotateGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "ray",
  (a, b) => [rotateJs(b, a.value[0]), rotateJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${rotateGlsl(ctx, b, `${a}.xy`)}, ${rotateGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "line",
  (a, b) => [rotateJs(b, a.value[0]), rotateJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${rotateGlsl(ctx, b, `${a}.xy`)}, ${rotateGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "vector",
  (a, b) => [rotateJs(b, a.value[0]), rotateJs(b, a.value[1])],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec4(${rotateGlsl(ctx, b, `${a}.xy`)}, ${rotateGlsl(ctx, b, `${a}.zw`)})`
  },
)

mark(
  "circle",
  (a, b) => ({
    center: rotateJs(b, a.value.center),
    radius: a.value.radius,
  }),
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `vec3(${rotateGlsl(ctx, b, `${a}.xy`)}, ${a}.z)`
  },
)

mark(
  "arc",
  (a, b) => [
    rotateJs(b, a.value[0]),
    rotateJs(b, a.value[1]),
    rotateJs(b, a.value[2]),
  ],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `mat3x2(${rotateGlsl(ctx, b, `${a}[0]`)}, ${rotateGlsl(ctx, b, `${a}[1]`)}, ${rotateGlsl(ctx, b, `${a}[2]`)})`
  },
)

mark(
  "polygon",
  (a, b) => a.value.map((x) => rotateJs(b, x)),
  () => {
    throw new Error("Cannot construct polygons in shaders yet.")
  },
)

mark(
  "angle",
  (a, b) => [
    rotateJs(b, a.value[0]),
    rotateJs(b, a.value[1]),
    rotateJs(b, a.value[2]),
  ],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `mat3x2(${rotateGlsl(ctx, b, `${a}[0]`)}, ${rotateGlsl(ctx, b, `${a}[1]`)}, ${rotateGlsl(ctx, b, `${a}[2]`)})`
  },
)

mark(
  "directedangle",
  (a, b) => [
    rotateJs(b, a.value[0]),
    rotateJs(b, a.value[1]),
    rotateJs(b, a.value[2]),
  ],
  (ctx, ar, b) => {
    const a = ctx.cache(ar)
    return `mat3x2(${rotateGlsl(ctx, b, `${a}[0]`)}, ${rotateGlsl(ctx, b, `${a}[1]`)}, ${rotateGlsl(ctx, b, `${a}[2]`)})`
  },
)

export function mark<const T extends TyName>(
  param: T,
  js: (arg: JsVal<T>, rotation: RotationJs) => Val<T>,
  glsl: (ctx: GlslContext, arg: GlslVal<T>, rotation: RotationGlsl) => string,
) {
  FN_ROTATE.add(
    [param, "point32", "r32"],
    param,
    (a, b, c) =>
      js(a, {
        c: b.value,
        cos: real(Math.cos(num(c.value))),
        sin: real(Math.sin(num(c.value))),
      }),
    (ctx, a, b, cr) => {
      const c = ctx.cache(cr)
      const by = ctx.cachedNative(
        "vec4",
        `vec4(${b.expr}, cos(${c}), sin(${c}))`,
      )
      return glsl(ctx, a, { by })
    },
  )
}
