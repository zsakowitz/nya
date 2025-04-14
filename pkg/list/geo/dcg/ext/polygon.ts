import { each, type JsVal, type JsValue } from "@/eval/ty"
import { rept, unpt } from "@/eval/ty/create"
import { CmdDot } from "@/field/cmd/leaf/num"
import { CmdVar } from "@/field/cmd/leaf/var"
import { CmdBrack } from "@/field/cmd/math/brack"
import { L, R } from "@/field/dir"
import { Prop } from "@/sheet/ext"
import { defineHideable } from "@/sheet/ext/hideable"
import type { Point } from "@/sheet/point"
import { Color, Opacity, Order, Size } from "@/sheet/ui/cv/consts"
import type { Expr } from "@/sheet/ui/expr"

type PolyItem =
  | { type: "poly"; poly: number; val: readonly Point[] }
  | { type: "segment"; poly: number; index: number; p1: Point; p2: Point }

const picked = new Prop<boolean[]>(() => [])

export const EXT_POLYGON = defineHideable<
  { value: JsValue<"polygon">; expr: Expr; picked: boolean[] },
  PolyItem
>({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "polygon") {
      return {
        value: value as JsValue<"polygon">,
        expr,
        picked: picked.get(expr),
      }
    }
  },
  plot: {
    // TODO: polygon insides are higher order during picking than segments, but not angles
    order() {
      return Order.Graph
    },
    items(data) {
      return each(data.value)
        .filter((raw) => raw.length >= 2)
        .flatMap((raw, poly): PolyItem[] => {
          const val = raw.map(unpt)
          return [
            ...val.map(
              (p1, index): PolyItem => ({
                type: "segment",
                poly,
                index,
                p1,
                p2: val[(index + 1) % val.length]!,
              }),
            ),
            { type: "poly", poly, val },
          ]
        })
    },
    draw(data, val, index) {
      if (val.type == "poly") {
        data.expr.sheet.cv.polygon(
          val.val,
          Size.Line,
          Color.Blue,
          1,
          Opacity.Fill,
          true,
        )
      }
      if (data.picked[index]) {
        if (val.type == "poly") {
          data.expr.sheet.cv.polygon(
            val.val,
            Size.LineRing,
            Color.Blue,
            Opacity.Pick,
            Opacity.Fill,
            true,
          )
        } else {
          data.expr.sheet.cv.polygon(
            [val.p1, val.p2],
            Size.LineRing,
            Color.Blue,
            Opacity.Pick,
          )
        }
      }
    },
    target: {
      hits(target, at, hint) {
        const cv = target.data.expr.sheet.cv

        if (target.item.type == "segment") {
          return (
            hint.allows("segment") &&
            cv.hits(at, cv.dPoly([target.item.p1, target.item.p2]))
          )
        }

        const path = cv.dPoly(target.item.val)

        return (
          hint.allows("polygon") &&
          (cv.hitsFill(at, path) ||
            (!hint.allows("segment") && cv.hits(at, path)))
        )
      },
      focus(data) {
        data.expr.focus()
      },
      ref(target) {
        const block = target.data.expr.createRef(target.item.poly)
        if (target.item.type == "segment") {
          const cursor = block.cursor(R)
          new CmdDot().insertAt(cursor, L)
          for (const c of "segments") {
            new CmdVar(c, target.data.expr.sheet.options).insertAt(cursor, L)
          }
          CmdBrack.index(target.item.index + 1).insertAt(cursor, L)
        }
        return block
      },
      val({ item }) {
        if (item.type == "poly") {
          return {
            type: "polygon",
            value: item.val.map(rept),
          }
        } else {
          return {
            type: "segment",
            value: [rept(item.p1), rept(item.p2)],
          } satisfies JsVal<"segment">
        }
      },
      toggle(item, on, reason) {
        if (reason == "pick") {
          item.data.expr.sheet.cv.cursor(on ? "pointer" : "default")
          item.data.picked[item.index] = on
          item.data.expr.sheet.cv.queue()
        }
      },
    },
  },
})
