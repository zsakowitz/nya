import { each, type JsVal, type JsValue } from "../../../eval/ty"
import { rept, unpt } from "../../../eval/ty/create"
import { CmdDot } from "../../../field/cmd/leaf/dot"
import { CmdNum } from "../../../field/cmd/leaf/num"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { CmdBrack } from "../../../field/cmd/math/brack"
import { Block, L, R } from "../../../field/model"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/point"
import { Color, Opacity, Order, Size } from "../../../sheet/ui/cv/consts"
import type { Expr } from "../../../sheet/ui/expr"

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
    order() {
      return Order.Graph
    },
    items(data) {
      return each(data.value)
        .filter((raw) => raw.length >= 2)
        .flatMap((raw, poly): PolyItem[] => {
          const val = raw.map(unpt)
          return [
            { type: "poly", poly, val },
            ...val.map(
              (p1, index): PolyItem => ({
                type: "segment",
                poly,
                index,
                p1,
                p2: val[(index + 1) % val.length]!,
              }),
            ),
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
        return target.item.type == "poly" ?
            hint.allows("polygon") && cv.hitsFill(at, cv.dPoly(target.item.val))
          : hint.allows("segment") &&
              cv.hits(at, cv.dPoly([target.item.p1, target.item.p2]))
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
          const index = new Block(null)
          new CmdBrack("[", "]", null, index).insertAt(cursor, L)
          const ic = index.cursor(R)
          for (const d of BigInt(target.item.index).toString()) {
            new CmdNum(d).insertAt(ic, L)
          }
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
          item.data.picked[item.index] = on
          item.data.expr.sheet.cv.queue()
        }
      },
    },
  },
})
