import { FnDist } from "../../dist"
import { real } from "../../../ty/create"

export const FN_RGB = new FnDist("rgb")
  .add(
    ["r32", "r32", "r32"],
    "color",
    (r, g, b) => ({
      type: "color",
      r: r.value,
      g: g.value,
      b: b.value,
      a: real(1),
    }),
    (_, r, g, b) => `vec4(vec3(${r.expr}, ${g.expr}, ${b.expr}) / 255.0, 1)`,
  )
  .add(
    ["r32", "r32", "r32", "r32"],
    "color",
    (r, g, b, a) => ({
      type: "color",
      r: r.value,
      g: g.value,
      b: b.value,
      a: a.value,
    }),
    (_, r, g, b, a) =>
      `vec4(vec3(${r.expr}, ${g.expr}, ${b.expr}) / 255.0, ${a.expr})`,
  )
