import type { GlslContext } from "../../../eval/lib/fn"
import {
  each,
  map,
  type GlslVal,
  type JsVal,
  type JsValue,
} from "../../../eval/ty"
import { real, unpt } from "../../../eval/ty/create"
import { Display } from "../../../eval/ty/display"
import { R } from "../../../field/model"
import { sx } from "../../../jsx"
import { defineHideable } from "../../../sheet/ext/hideable"
import { normSegment, type Paper, type Point } from "../../../sheet/ui/paper"
import { STORE_EVAL } from "../../eval"

export const LINE = 32
export const ARC = 20

export function angleJs({ value, type }: JsVal<"angle" | "directedangle">) {
  const p0 = unpt(value[0])
  const p1 = unpt(value[1])
  const p2 = unpt(value[2])

  const measure =
    (Math.atan2(p0.x - p1.x, p0.y - p1.y) -
      Math.atan2(p2.x - p1.x, p2.y - p1.y) +
      2 * Math.PI) %
    (2 * Math.PI)

  if (measure > Math.PI) {
    return real(type == "angle" ? 2 * Math.PI - measure : measure - 2 * Math.PI)
  } else {
    return real(measure)
  }
}

export function angleGlsl(
  ctx: GlslContext,
  { expr, type }: GlslVal<"angle" | "directedangle">,
) {
  ctx.glsl`float _helper_angle(mat3x2 a) {
  float m = mod(
    atan(a[0].x - a[1].x, a[0].y - a[1].y) -
    atan(a[2].x - a[1].x, a[2].y - a[1].y) -
    6.283185307179586,
    6.283185307179586
  );

  if (m > 3.141592653589793) {
    return 6.283185307179586 - m;
  } else {
    return m;
  }
}
float _helper_directedangle(mat3x2 a) {
  float m = mod(
    atan(a[0].x - a[1].x, a[0].y - a[1].y) -
    atan(a[2].x - a[1].x, a[2].y - a[1].y) -
    6.283185307179586,
    6.283185307179586
  );

  if (m > 3.141592653589793) {
    return m - 6.283185307179586;
  } else {
    return m;
  }
}
`
  return `_helper_${type}(${expr})`
}

export function drawAngle(
  paper: Paper,
  p1: Point,
  p2: Point,
  p3: Point,
  props: { draft?: boolean; type: "angle" | "directedangle" },
) {
  const measure =
    (Math.atan2(p1.x - p2.x, p1.y - p2.y) -
      Math.atan2(p3.x - p2.x, p3.y - p2.y) +
      2 * Math.PI) %
    (2 * Math.PI)

  const swap = measure > Math.PI

  const o1 = paper.toOffset(p1)
  const o2 = paper.toOffset(p2)
  const o3 = paper.toOffset(p3)
  const s1 = normSegment(o2, o1, LINE)
  const s3 = normSegment(o2, o3, LINE)
  const a1 = normSegment(o2, o1, ARC)
  const a3 = normSegment(o2, o3, ARC)

  paper.addClass("angleline", "opacity-[50%]")
  for (const s of [s1, s3]) {
    paper.append(
      "angleline",
      sx("line", {
        x1: o2.x,
        y1: o2.y,
        x2: s.x,
        y2: s.y,
        "stroke-width": 1.5,
        stroke: "var(--nya-angle)",
        "stroke-linecap": "round",
        class:
          props?.draft ? "" : (
            "picking-any:opacity-30 picking-angle:opacity-100"
          ),
      }),
    )
  }

  const src = swap ? a3 : a1
  const dst = swap ? a1 : a3

  const path =
    (
      props.type == "angle" &&
      Math.abs((measure % Math.PI) - Math.PI / 2) < 9e-7
    ) ?
      `M ${src.x} ${src.y} L ${a1.x + a3.x - o2.x} ${a1.y + a3.y - o2.y} L ${dst.x} ${dst.y}`
    : `M ${src.x} ${src.y} A ${ARC} ${ARC} 0 0 0 ${dst.x} ${dst.y}`

  const g = sx(
    "g",
    props?.draft ? "" : "picking-any:opacity-30 picking-angle:opacity-100",
    sx("path", {
      d: path,
      "stroke-width": 3,
      stroke: "var(--nya-angle)",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
  )

  if (props.type == "directedangle") {
    const size = Math.max(
      4,
      Math.min(
        8,
        ((measure > Math.PI ? 2 * Math.PI - measure : measure) * ARC) / 2,
      ),
    )

    // source: https://www.desmos.com/geometry/e4uy7yykhv
    // rotates the triangle so the center of the back edge is on the angle's arc
    const adj = 0.0323385 * size - 0.00388757

    const tilt = swap ? -adj : Math.PI + adj
    const dx1 = Math.cos(tilt) * (a3.y - o2.y) + Math.sin(tilt) * (a3.x - o2.x)
    const dy1 = Math.cos(tilt) * (a3.x - o2.x) - Math.sin(tilt) * (a3.y - o2.y)

    const dx = -dx1
    const dy = dy1
    const nx = (size * dx) / Math.hypot(dx, dy)
    const ny = (size * dy) / Math.hypot(dx, dy)
    const ox = a3.x - nx
    const oy = a3.y - ny
    const w = 0.4

    g.appendChild(
      sx("path", {
        d: `M ${a3.x} ${a3.y} L ${ox + w * ny} ${oy - w * nx} L ${ox - w * ny} ${oy + w * nx} Z`,
        "stroke-width": 3,
        stroke: "var(--nya-angle)",
        fill: "var(--nya-angle)",
        "stroke-linejoin": "round",
      }),
    )
  } else {
    g.appendChild(
      sx("path", {
        d: `${path} L ${o2.x} ${o2.y} Z`,
        fill: "var(--nya-angle)",
        "fill-opacity": 0.3,
      }),
    )
  }

  paper.append("anglearc", g)
}

export const EXT_ANGLE = defineHideable({
  data(expr) {
    const raw = expr.js?.value

    if (raw && (raw.type == "angle" || raw.type == "directedangle")) {
      const value = raw as JsValue<"angle" | "directedangle">

      const { field, el } = STORE_EVAL.get(expr)
      const { block } = field
      block.clear()
      new Display(block.cursor(R), expr.js!.base).output(
        map(value, "r32", (val) => angleJs({ value: val, type: value.type })),
      )

      return { value, expr, el }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      drawAngle(paper, unpt(val[0]), unpt(val[1]), unpt(val[2]), {
        type: data.value.type,
      })
    }
  },
  el(data) {
    return data.el
  },
})
