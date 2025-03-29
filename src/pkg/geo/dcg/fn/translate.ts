import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import type { GlslVal, JsVal, SPoint, TyName, Val } from "@/eval/ty"
import { pt } from "@/eval/ty/create"
import { add, sub } from "@/eval/ty/ops"

export function translate(by: [SPoint, SPoint], target: SPoint) {
  return pt(
    add(sub(by[1].x, by[0].x), target.x),
    add(sub(by[1].y, by[0].y), target.y),
  )
}

export const FN_TRANSLATE = new FnDist(
  "translate",
  "translates an object by a vector",
)

mark(
  "point32",
  (a, b) => translate(b, a.value),
  (_, a, b) => `(${a.expr} + (${b}.zw - ${b}.xy))`,
  "(2,3)",
)

mark(
  "segment",
  (a, b) => [translate(b, a.value[0]), translate(b, a.value[1])],
  (_, a, b) => `(${a.expr} + (${b}.zw - ${b}.xy).xyxy)`,
)

mark(
  "ray",
  (a, b) => [translate(b, a.value[0]), translate(b, a.value[1])],
  (_, a, b) => `(${a.expr} + (${b}.zw - ${b}.xy).xyxy)`,
)

mark(
  "line",
  (a, b) => [translate(b, a.value[0]), translate(b, a.value[1])],
  (_, a, b) => `(${a.expr} + (${b}.zw - ${b}.xy).xyxy)`,
)

mark(
  "vector",
  (a, b) => [translate(b, a.value[0]), translate(b, a.value[1])],
  (_, a, b) => `(${a.expr} + (${b}.zw - ${b}.xy).xyxy)`,
)

mark(
  "circle",
  (a, b) => ({
    center: translate(b, a.value.center),
    radius: a.value.radius,
  }),
  (_, a, b) => `(${a.expr} + vec3(${b}.zw - ${b}.xy, 0))`,
)

mark(
  "arc",
  (a, b) => [
    translate(b, a.value[0]),
    translate(b, a.value[1]),
    translate(b, a.value[2]),
  ],
  (ctx, a, b) => {
    const d = ctx.cached("point32", `(${b}.zw - ${b}.xy)`)
    return `(${a.expr} + mat3x2(${d}, ${d}, ${d}))`
  },
)

mark(
  "polygon",
  (a, b) => a.value.map((x) => translate(b, x)),
  () => {
    throw new Error("Cannot construct polygons in shaders yet.")
  },
)

mark(
  "angle",
  (a, b) => [
    translate(b, a.value[0]),
    translate(b, a.value[1]),
    translate(b, a.value[2]),
  ],
  (ctx, a, b) => {
    const d = ctx.cached("point32", `(${b}.zw - ${b}.xy)`)
    return `(${a.expr} + mat3x2(${d}, ${d}, ${d}))`
  },
)

mark(
  "directedangle",
  (a, b) => [
    translate(b, a.value[0]),
    translate(b, a.value[1]),
    translate(b, a.value[2]),
  ],
  (ctx, a, b) => {
    const d = ctx.cached("point32", `(${b}.zw - ${b}.xy)`)
    return `(${a.expr} + mat3x2(${d}, ${d}, ${d}))`
  },
)

export function mark<const T extends TyName>(
  param: T,
  js: (arg: JsVal<T>, vector: [SPoint, SPoint]) => Val<T>,
  glsl: (ctx: GlslContext, arg: GlslVal<T>, vector: string) => string,
  // DOCS: figure out something better than ellipses
  usage = `${param}(...)`,
) {
  FN_TRANSLATE.add(
    [param, "vector"],
    param,
    (a, b) => js(a, b.value),
    (ctx, a, b) => glsl(ctx, a, ctx.cache(b)),
    `translate(${usage},vector((2,3),(7,-10)))`,
  )

  FN_TRANSLATE.add(
    [param, "point32", "point32"],
    param,
    (a, b, c) => js(a, [b.value, c.value]),
    (ctx, a, b, c) =>
      glsl(ctx, a, ctx.cached("vector", `vec4(${b.expr}, ${c.expr})`)),
    `translate(${usage},(2,3),(7,-10))`,
    1,
  )
}
