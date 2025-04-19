import { each, type JsValue, type Val } from "@/eval/ty"
import { Prop } from "@/sheet/ext"
import { defineHideable } from "@/sheet/ext/hideable"
import { Color, Opacity, Order, Size } from "@/sheet/ui/cv/consts"
import { ref, val } from "@/sheet/ui/cv/item"
import type { Expr } from "@/sheet/ui/expr"

const picked = new Prop<boolean[]>(() => [])

export const EXT_CIRCLE = defineHideable<
  { value: JsValue<"circle">; expr: Expr },
  Val<"circle">
>({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "circle") {
      return {
        value: value as JsValue<"circle">,
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
      data.expr.sheet.cv.circle(
        val.center.xy(),
        val.radius.num(),
        Size.Line,
        Color.Green,
      )
      if (picked.get(data.expr)[index]) {
        data.expr.sheet.cv.circle(
          val.center.xy(),
          val.radius.num(),
          Size.LineRing,
          Color.Green,
          Opacity.Pick,
        )
      }
    },
    target: {
      focus(data) {
        data.expr.focus()
      },
      hits({ data, item }, at, hint) {
        return (
          hint.allows(data.value.type) &&
          data.expr.sheet.cv.hitsCircle(at, item.center.xy(), item.radius.num())
        )
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
