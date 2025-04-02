import { type PropsGlsl } from "@/eval/glsl"
import type { GlslResult } from "@/eval/lib/fn"
import type { GlslValue } from "@/eval/ty"
import { declareAddR64, OP_PLOTSIGN } from "@/pkg/core/ops"
import type { Cv } from "./ui/cv"

export function createLine(
  cv: Cv,
  props: PropsGlsl,
  lhs: () => GlslValue,
  rhs: () => GlslValue,
): GlslResult {
  declareAddR64(props.ctx)

  type Coord = [number, number]
  /**
   * `BASE` is specified in 120° increments because it produces pretty balanced
   * results without needing more than three points. The base conditions we'd
   * like to have are:
   *
   * 1. Lines of all slopes look even
   * 2. Curves like `sin x` and `x³` don't seem to change thickness
   *
   * Using 120° increments combined with the anti-alising system seems to work
   * pretty well for that, so that's what we do.
   */
  const BASE: Coord[] = Array.from({ length: 3 }, (_, i) => [
    Math.cos((i * 2 * Math.PI) / 3),
    Math.sin((i * 2 * Math.PI) / 3),
  ])

  const DIST = 1.5 * cv.scale
  const jsOffsets: Coord[] = [
    ...BASE.map(([a, b]): Coord => [a * DIST, b * DIST]),
    ...BASE.map(([a, b]): Coord => [a * (DIST + 0.5), b * (DIST + 0.5)]),
    [0, 0],
  ]

  const offsets = props.ctx.name()
  props.ctx
    .push`vec2[${jsOffsets.length}] ${offsets} = vec2[${jsOffsets.length}](${jsOffsets.map(([x, y]) => `vec2(${x}, ${y})`).join(", ")});\n`

  const ret = props.ctx.name()
  props.ctx.push`float[${jsOffsets.length}] ${ret};\n`
  const i = props.ctx.name()
  props.ctx.push`for (int ${i} = 0; ${i} < ${jsOffsets.length}; ${i}++) {\n`
  const o = props.ctx.name()
  // FIXME: zooming in a lot means this offset doesn't matter; it should be capped
  props.ctx
    .push`vec4 ${o} = vec4(u_unit_per_hpx.xy * ${offsets}[${i}].x, u_unit_per_hpx.zw * ${offsets}[${i}].y);\n`
  props.ctx.push`v_coords += ${o};\n`
  const l = lhs()
  const r = rhs()
  if (l.list !== false || r.list !== false) {
    throw new Error(`Cannot plot a list of equalities yet.`)
  }
  const diff = OP_PLOTSIGN.glsl1(props.ctx, l, r)
  props.ctx.push`${ret}[${i}] = ${diff.expr};\n`
  props.ctx.push`v_coords -= ${o};\n`
  props.ctx.push`}\n`

  const count = Array(BASE.length)
    .fill(0)
    .map((_, i) => `int(${ret}[${i}]<0.0)`)
    .join("+")
  const count2 = Array(BASE.length)
    .fill(0)
    .map((_, i) => `int(${ret}[${i + BASE.length}]<0.0)`)
    .join("+")
  const skip = Array(BASE.length)
    .fill(0)
    .map((_, i) => {
      const el = `${ret}[${i}]`
      return `isnan(${el}) || isinf(${el})`
    })
    .join(" || ")

  return [
    props.ctx,
    `vec4(0.1764705882, 0.4392156863, 0.7019607843,
      ${skip} ? 0.0 :
      (${count} != 0 && ${count} != ${BASE.length}) ? 1.0 :
      (${count2} != 0 && ${count2} != ${BASE.length}) ? 0.5 :
      0.0
    )`,
  ]
}
