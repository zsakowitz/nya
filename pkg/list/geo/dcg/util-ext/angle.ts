import { STORE_EVAL } from "$/eval"
import type { GlslContext } from "@/eval/lib/fn"
import { each, map, type GlslVal, type JsVal, type JsValue } from "@/eval/ty"
import { Display } from "@/eval/ty/display"
import { R } from "@/field/dir"
import type { Point } from "@/lib/point"
import type { SPoint } from "@/lib/point"
import { int } from "@/lib/real"
import { Prop } from "@/sheet/ext"
import { defineHideable } from "@/sheet/ext/hideable"
import type { Cv } from "@/sheet/ui/cv"
import { Color, Opacity, Order, Size } from "@/sheet/ui/cv/consts"
import { ref, val } from "@/sheet/ui/cv/item"
import type { Expr } from "@/sheet/ui/expr"

const LINE = Size.AngleGuideLength
const ARC = Size.AngleArcDistance

export function angleJs({ value, type }: JsVal<"angle" | "directedangle">) {
  const p0 = value[0].ns()
  const p1 = value[1].ns()
  const p2 = value[2].ns()

  const measure =
    (Math.atan2(p0.x - p1.x, p0.y - p1.y) -
      Math.atan2(p2.x - p1.x, p2.y - p1.y) +
      2 * Math.PI) %
    (2 * Math.PI)

  if (measure > Math.PI) {
    return int(type == "angle" ? 2 * Math.PI - measure : measure - 2 * Math.PI)
  } else {
    return int(measure)
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

export function drawAngleCv(
  cv: Cv,
  p1: Point,
  p2: Point,
  p3: Point,
  props: { kind: "angle" | "directedangle" },
  size: number = Size.Line,
  alpha = 1,
) {
  const measure =
    (Math.atan2(p1.x - p2.x, p1.y - p2.y) -
      Math.atan2(p3.x - p2.x, p3.y - p2.y) +
      2 * Math.PI) %
    (2 * Math.PI)

  const swap = measure > Math.PI

  const o1 = cv.toCanvas(p1)
  const o2 = cv.toCanvas(p2)
  const o3 = cv.toCanvas(p3)
  const s1 = o1.normFrom(o2, cv.scale * LINE)
  const s3 = o3.normFrom(o2, cv.scale * LINE)
  const a1 = o1.normFrom(o2, cv.scale * ARC)
  const a3 = o3.normFrom(o2, cv.scale * ARC)

  const src = swap ? a3 : a1
  const dst = swap ? a1 : a3

  const plainPath =
    (
      props.kind == "angle" &&
      Math.abs((measure % Math.PI) - Math.PI / 2) < 9e-7
    ) ?
      `M ${src.x} ${src.y} L ${a1.x + a3.x - o2.x} ${a1.y + a3.y - o2.y} L ${dst.x} ${dst.y}`
    : `M ${src.x} ${src.y} A ${cv.scale * ARC} ${cv.scale * ARC} 0 0 0 ${dst.x} ${dst.y}`

  let d = plainPath

  if (props.kind == "directedangle") {
    const size =
      cv.scale *
      Math.max(
        Size.DirectedAngleMinHeadSize,
        Math.min(
          Size.DirectedAngleMaxHeadSize,
          ((measure > Math.PI ? 2 * Math.PI - measure : measure) * ARC) / 2,
        ),
      )

    // source: https://www.desmos.com/geometry/e4uy7yykhv
    // rotates the triangle so the center of the back edge is on the angle's arc
    const adj = Math.min(
      Math.atan(Size.VectorWidthRatio),
      0.0323385 * (size / cv.scale) - 0.00388757,
    )

    const tilt = swap ? -adj : Math.PI + adj
    const dx1 = Math.cos(tilt) * (a3.y - o2.y) + Math.sin(tilt) * (a3.x - o2.x)
    const dy1 = Math.cos(tilt) * (a3.x - o2.x) - Math.sin(tilt) * (a3.y - o2.y)

    const dx = -dx1
    const dy = dy1
    const nx = (size * dx) / Math.hypot(dx, dy)
    const ny = (size * dy) / Math.hypot(dx, dy)
    const ox = a3.x - nx
    const oy = a3.y - ny
    const w = Size.VectorWidthRatio

    d += ` M ${a3.x} ${a3.y} L ${ox + w * ny} ${oy - w * nx} L ${ox - w * ny} ${oy + w * nx} Z`
  }

  cv.path(new Path2D(d), size, Color.Angle, alpha)

  if (props.kind == "angle") {
    cv.path(
      new Path2D(`${plainPath} L ${o2.x} ${o2.y} Z`),
      size,
      Color.Angle,
      0,
      0.3,
    )
  }

  for (const s of [s1, s3]) {
    cv.polygonByCanvas([o2, s], Size.AngleGuide, Color.Angle, Opacity.AngleLine)
  }
}

function anglePath(
  cv: Cv,
  p1: Point,
  p2: Point,
  p3: Point,
  props: { kind: "angle" | "directedangle" },
) {
  const measure =
    (Math.atan2(p1.x - p2.x, p1.y - p2.y) -
      Math.atan2(p3.x - p2.x, p3.y - p2.y) +
      2 * Math.PI) %
    (2 * Math.PI)

  const swap = measure > Math.PI

  const o1 = cv.toCanvas(p1)
  const o2 = cv.toCanvas(p2)
  const o3 = cv.toCanvas(p3)
  const a1 = o2.normFrom(o1, cv.scale * ARC)
  const a3 = o2.normFrom(o3, cv.scale * ARC)

  const src = swap ? a3 : a1
  const dst = swap ? a1 : a3

  const d =
    (
      props.kind == "angle" &&
      Math.abs((measure % Math.PI) - Math.PI / 2) < 9e-7
    ) ?
      `M ${src.x} ${src.y} L ${a1.x + a3.x - o2.x} ${a1.y + a3.y - o2.y} L ${dst.x} ${dst.y}`
    : `M ${src.x} ${src.y} A ${cv.scale * ARC} ${cv.scale * ARC} 0 0 0 ${dst.x} ${dst.y}`

  return new Path2D(d)
}

const picked = new Prop<boolean[]>(() => [])

export const EXT_ANGLE = defineHideable<
  {
    value: JsValue<"angle" | "directedangle">
    expr: Expr
    el: HTMLSpanElement
    picked: boolean[]
  },
  [SPoint, SPoint, SPoint]
>({
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

      return { value, expr, el, picked: picked.get(expr) }
    }
  },
  plot: {
    order() {
      return Order.Graph
    },
    items(data) {
      return each(data.value)
    },
    draw(data, val, index) {
      drawAngleCv(data.expr.sheet.cv, val[0].ns(), val[1].ns(), val[2].ns(), {
        kind: data.value.type,
      })
      if (data.picked[index]) {
        drawAngleCv(
          data.expr.sheet.cv,
          val[0].ns(),
          val[1].ns(),
          val[2].ns(),
          { kind: data.value.type },
          Size.LineRing,
          Opacity.Pick,
        )
      }
    },
    target: {
      hits(target, at, hint) {
        if (!hint.allows(target.data.value.type)) return false
        return target.data.expr.sheet.cv.hits(
          at,
          anglePath(
            target.data.expr.sheet.cv,
            target.item[0].ns(),
            target.item[1].ns(),
            target.item[2].ns(),
            { kind: target.data.value.type },
          ),
        )
      },
      focus(data) {
        data.expr.focus()
      },
      val,
      ref,
      toggle(item, on, reason) {
        if (reason == "pick") {
          item.data.expr.sheet.cv.cursor(on ? "pointer" : "default")
          picked.get(item.data.expr)[item.index] = on
          item.data.expr.sheet.cv.queue()
        }
      },
    },
  },
  el(data) {
    return data.el
  },
})
