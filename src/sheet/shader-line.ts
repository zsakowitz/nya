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

  const DIST = 1.5 * cv.scale
  const offsets = props.ctx.name()
  const s = Math.SQRT1_2
  const jsOffsets: [number, number][] = [
    [1, 0],
    [s, s],
    [0, 1],
    [-s, s],
    [-1, 0],
    [-s, -s],
    [0, -1],
    [s, -s],

    ...(
      [
        [1, 0],
        [s, s],
        [0, 1],
        [-s, s],
        [-1, 0],
        [-s, -s],
        [0, -1],
        [s, -s],
      ] satisfies [number, number][]
    ).map(([a, b]): [number, number] => [
      (a * DIST + 0.5 * a) / DIST,
      (b * DIST + 0.5 * b) / DIST,
    ]),

    ...(
      [
        [1, 0],
        [s, s],
        [0, 1],
        [-s, s],
        [-1, 0],
        [-s, -s],
        [0, -1],
        [s, -s],
      ] satisfies [number, number][]
    ).map(([a, b]): [number, number] => [
      (a * DIST + a) / DIST,
      (b * DIST + b) / DIST,
    ]),
  ]
  props.ctx
    .push`vec2[${jsOffsets.length}] ${offsets} = vec2[${jsOffsets.length}](${jsOffsets.map(([x, y]) => `vec2(${DIST * x}, ${DIST * y})`).join(", ")});\n`
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

  const count = Array(8)
    .fill(0)
    .map((_, i) => `int(${ret}[${i}]<0.0)`)
    .join("+")
  const count2 = Array(8)
    .fill(0)
    .map((_, i) => `int(${ret}[${i + 8}]<0.0)`)
    .join("+")
  const count3 = Array(8)
    .fill(0)
    .map((_, i) => `int(${ret}[${i + 16}]<0.0)`)
    .join("+")

  return [
    props.ctx,
    `vec4(0.1764705882, 0.4392156863, 0.7019607843,
      (${count} != 0 && ${count} != 8) ? 1.0 :
      (${count2} != 0 && ${count2} != 8) ? 0.5 :
      (${count3} != 0 && ${count3} != 8) ? 0.25 :
      0.0
    )`,
  ]
}
