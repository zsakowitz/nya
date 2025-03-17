import { each, type JsValue, type Val } from "../../../eval/ty"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Cv } from "../../../sheet/ui/cv"
import { Color, Opacity, Order, Size } from "../../../sheet/ui/cv/consts"
import { ref, val } from "../../../sheet/ui/cv/item"
import type { Expr } from "../../../sheet/ui/expr"
import { arcPath, computeArcVal, type Arc, type ArcPath } from "../arc"

export function arcPathD(o: ArcPath) {
  return (
    o.type == "circle" ?
      `M ${o.p1.x} ${o.p1.y} A ${o.r.x} ${o.r.y} 0 ${o.flags} ${o.p3.x} ${o.p3.y}`
    : o.type == "segment" ? `M ${o.p1.x} ${o.p1.y} L ${o.p3.x} ${o.p3.y}`
    : o.type == "tworay" ?
      (o.r1 ? `M ${o.r1[0].x} ${o.r1[0].y} L ${o.r1[1].x} ${o.r1[1].y}` : "") +
      (o.r3 ? ` M ${o.r3[0].x} ${o.r3[0].y} L ${o.r3[1].x} ${o.r3[1].y}` : "")
    : null
  )
}

export function drawArcCv(
  cv: Cv,
  arc: Arc,
  size: number = Size.Line,
  alpha = 1,
) {
  const d = arcPathD(arcPath(cv, arc))
  if (!d) return
  cv.path(new Path2D(d), size, Color.Green, alpha)
}

const picked = new Prop<boolean[]>(() => [])

export const EXT_ARC = defineHideable<
  { value: JsValue<"arc">; expr: Expr },
  Val<"arc">
>({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "arc") {
      return {
        value: value as JsValue<"arc">,
        expr,
      }
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
      const arc = computeArcVal(val)
      drawArcCv(data.expr.sheet.cv, arc)
      if (picked.get(data.expr)[index]) {
        drawArcCv(data.expr.sheet.cv, arc, Size.LineRing, Opacity.Pick)
      }
    },
    target: {
      focus(data) {
        data.expr.focus()
      },
      hits({ data, item }, at, hint) {
        if (!hint.allows(data.value.type)) return false
        const arc = computeArcVal(item)
        const path = arcPath(data.expr.sheet.cv, arc)
        const d = arcPathD(path)
        if (!d) return false
        return data.expr.sheet.cv.hits(at, new Path2D(d))
      },
      ref,
      val,
      toggle(item, on, reason) {
        if (reason == "pick") {
          item.data.expr.sheet.cv.cursor(on ? "pointer" : "default")
          picked.get(item.data.expr)[item.index] = on
          item.data.expr.sheet.cv.queue()
        }
      },
    },
  },
})
