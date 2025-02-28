import { FnDist } from "../../../eval/ops/dist"
import type { SPoint } from "../../../eval/ty"
import { pt } from "../../../eval/ty/create"
import { add, sub } from "../../../eval/ty/ops"

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
  .add(
    ["point32", "vector"],
    "point32",
    (a, b) => translate(b.value, a.value),
    (ctx, a, br) => {
      const b = ctx.cache(br)
      return `(${a.expr} + (${b}.zw - ${b}.xy))`
    },
  )
  .add(
    ["segment", "vector"],
    "segment",
    (a, b) => [translate(b.value, a.value[0]), translate(b.value, a.value[1])],
    (ctx, a, br) => {
      const b = ctx.cache(br)
      return `(${a.expr} + (${b}.zw - ${b}.xy).xyxy)`
    },
  )
  .add(
    ["ray", "vector"],
    "ray",
    (a, b) => [translate(b.value, a.value[0]), translate(b.value, a.value[1])],
    (ctx, a, br) => {
      const b = ctx.cache(br)
      return `(${a.expr} + (${b}.zw - ${b}.xy).xyxy)`
    },
  )
  .add(
    ["line", "vector"],
    "line",
    (a, b) => [translate(b.value, a.value[0]), translate(b.value, a.value[1])],
    (ctx, a, br) => {
      const b = ctx.cache(br)
      return `(${a.expr} + (${b}.zw - ${b}.xy).xyxy)`
    },
  )
  .add(
    ["vector", "vector"],
    "vector",
    (a, b) => [translate(b.value, a.value[0]), translate(b.value, a.value[1])],
    (ctx, a, br) => {
      const b = ctx.cache(br)
      return `(${a.expr} + (${b}.zw - ${b}.xy).xyxy)`
    },
  )
  .add(
    ["angle", "vector"],
    "angle",
    (a, b) => [
      translate(b.value, a.value[0]),
      translate(b.value, a.value[1]),
      translate(b.value, a.value[2]),
    ],
    (ctx, a, br) => {
      const b = ctx.cache(br)
      const d = ctx.cached("point32", `(${b}.zw - ${b}.xy)`)
      return `(${a.expr} + mat3x2(${d}, ${d}, ${d}))`
    },
  )
  .add(
    ["directedangle", "vector"],
    "directedangle",
    (a, b) => [
      translate(b.value, a.value[0]),
      translate(b.value, a.value[1]),
      translate(b.value, a.value[2]),
    ],
    (ctx, a, br) => {
      const b = ctx.cache(br)
      const d = ctx.cached("point32", `(${b}.zw - ${b}.xy)`)
      return `(${a.expr} + mat3x2(${d}, ${d}, ${d}))`
    },
  )
  .add(
    ["arc", "vector"],
    "arc",
    (a, b) => [
      translate(b.value, a.value[0]),
      translate(b.value, a.value[1]),
      translate(b.value, a.value[2]),
    ],
    (ctx, a, br) => {
      const b = ctx.cache(br)
      const d = ctx.cached("point32", `(${b}.zw - ${b}.xy)`)
      return `(${a.expr} + mat3x2(${d}, ${d}, ${d}))`
    },
  )
  .add(
    ["circle", "vector"],
    "circle",
    (a, b) => ({
      center: translate(b.value, a.value.center),
      radius: a.value.radius,
    }),
    (ctx, a, br) => {
      const b = ctx.cache(br)
      return `(${a.expr} + vec3(${b}.zw - ${b}.xy, 0))`
    },
  )
  .add(
    ["polygon", "vector"],
    "polygon",
    (a, b) => a.value.map((x) => translate(b.value, x)),
    () => {
      throw new Error("Cannot construct polygons in shaders yet.")
    },
  )

  .add(
    ["point32", "point32", "point32"],
    "point32",
    (a, b, c) => translate([b.value, c.value], a.value),
    (_, a, b, c) => {
      return `(${a.expr} + (${c.expr} - ${b.expr}))`
    },
  )
  .add(
    ["segment", "point32", "point32"],
    "segment",
    (a, b, c) => [
      translate([b.value, c.value], a.value[0]),
      translate([b.value, c.value], a.value[1]),
    ],
    (_, a, b, c) => {
      return `(${a.expr} + (${c.expr} - ${b.expr}).xyxy)`
    },
  )
  .add(
    ["ray", "point32", "point32"],
    "ray",
    (a, b, c) => [
      translate([b.value, c.value], a.value[0]),
      translate([b.value, c.value], a.value[1]),
    ],
    (_, a, b, c) => {
      return `(${a.expr} + (${c.expr} - ${b.expr}).xyxy)`
    },
  )
  .add(
    ["line", "point32", "point32"],
    "line",
    (a, b, c) => [
      translate([b.value, c.value], a.value[0]),
      translate([b.value, c.value], a.value[1]),
    ],
    (_, a, b, c) => {
      return `(${a.expr} + (${c.expr} - ${b.expr}).xyxy)`
    },
  )
  .add(
    ["vector", "point32", "point32"],
    "vector",
    (a, b, c) => [
      translate([b.value, c.value], a.value[0]),
      translate([b.value, c.value], a.value[1]),
    ],
    (_, a, b, c) => {
      return `(${a.expr} + (${c.expr} - ${b.expr}).xyxy)`
    },
  )
  .add(
    ["angle", "point32", "point32"],
    "angle",
    (a, b, c) => [
      translate([b.value, c.value], a.value[0]),
      translate([b.value, c.value], a.value[1]),
      translate([b.value, c.value], a.value[2]),
    ],
    (ctx, a, b, c) => {
      const d = ctx.cached("point32", `(${c.expr} - ${b.expr})`)
      return `(${a.expr} + mat3x2(${d}, ${d}, ${d}))`
    },
  )
  .add(
    ["directedangle", "point32", "point32"],
    "directedangle",
    (a, b, c) => [
      translate([b.value, c.value], a.value[0]),
      translate([b.value, c.value], a.value[1]),
      translate([b.value, c.value], a.value[2]),
    ],
    (ctx, a, b, c) => {
      const d = ctx.cached("point32", `(${c.expr} - ${b.expr})`)
      return `(${a.expr} + mat3x2(${d}, ${d}, ${d}))`
    },
  )
  .add(
    ["arc", "point32", "point32"],
    "arc",
    (a, b, c) => [
      translate([b.value, c.value], a.value[0]),
      translate([b.value, c.value], a.value[1]),
      translate([b.value, c.value], a.value[2]),
    ],
    (ctx, a, b, c) => {
      const d = ctx.cached("point32", `(${c.expr} - ${b.expr})`)
      return `(${a.expr} + mat3x2(${d}, ${d}, ${d}))`
    },
  )
  .add(
    ["circle", "point32", "point32"],
    "circle",
    (a, b, c) => ({
      center: translate([b.value, c.value], a.value.center),
      radius: a.value.radius,
    }),
    (_, a, b, c) => {
      return `(${a.expr} + vec3(${c.expr}.zw - ${b.expr}.xy, 0))`
    },
  )
  .add(
    ["polygon", "point32", "point32"],
    "polygon",
    (a, b, c) => a.value.map((x) => translate([b.value, c.value], x)),
    () => {
      throw new Error("Cannot construct polygons in shaders yet.")
    },
  )
