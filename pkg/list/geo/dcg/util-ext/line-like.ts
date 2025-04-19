import { type JsValue, type SPoint, each } from "@/eval/ty"
import { Prop } from "@/sheet/ext"
import { defineHideable } from "@/sheet/ext/hideable"
import type { Cv } from "@/sheet/ui/cv"
import { Color, Opacity, Order, Size } from "@/sheet/ui/cv/consts"
import { ref, val } from "@/sheet/ui/cv/item"
import type { Expr } from "@/sheet/ui/expr"

export function createLineLikeExt(
  type: "line" | "ray" | "segment" | "vector",
  path: (cv: Cv, p1: Point, p2: Point) => Path2D | null,
) {
  const picked = new Prop<boolean[]>(() => [])

  return defineHideable<
    { value: JsValue<"line" | "ray" | "segment">; expr: Expr },
    [SPoint, SPoint]
  >({
    data(expr) {
      const value = expr.js?.value

      if (value && value.type == type) {
        return { value: value as JsValue<"line" | "ray" | "segment">, expr }
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
        const { cv } = data.expr.sheet
        const d = path(cv, unpt(val[0]), unpt(val[1]))
        if (d) {
          cv.path(d, Size.Line, Color.Blue, 1, 1)
          if (picked.get(data.expr)[index]) {
            cv.path(d, Size.LineRing, Color.Blue, Opacity.Pick)
          }
        }
      },
      target: {
        hits(target, at, hint) {
          if (!hint.allows(target.data.value.type)) return false
          const d = path(
            target.data.expr.sheet.cv,
            unpt(target.item[0]),
            unpt(target.item[1]),
          )
          return !!d && target.data.expr.sheet.cv.hits(at, d)
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
  })
}
