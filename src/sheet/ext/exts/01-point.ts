import { defineExt, Store } from ".."
import { each, type JsValue } from "../../../eval/ty"
import { frac, num, unpt } from "../../../eval/ty/create"
import { Display } from "../../../eval/ty/display"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdComma } from "../../../field/cmd/leaf/comma"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { CmdBrack } from "../../../field/cmd/math/brack"
import { Block, L, R } from "../../../field/model"
import { Transition } from "../../transition"

const color = new Store(
  (expr) => new Transition(3.5, () => expr.sheet.paper.queue()),
)

export const EXT_POINT = defineExt({
  data(expr) {
    const value = expr.js?.value

    color.get(expr)

    if (
      value &&
      (value.type == "point32" ||
        value.type == "point64" ||
        value.type == "c32" ||
        value.type == "c64")
    ) {
      return {
        value: value as JsValue<"c32" | "c64" | "point32" | "point64">,
        paper: expr.sheet.paper,
        expr,
      }
    }
  },
  plot2d(data, paper) {
    for (const pt of each(data.value)) {
      const x = num(pt.x)
      const y = num(pt.y)
      if (!(isFinite(x) && isFinite(y))) continue

      const offset = paper.paperToCanvas({ x, y })
      const { ctx, scale } = paper

      ctx.beginPath()
      ctx.fillStyle = "#6042a659"
      ctx.arc(offset.x, offset.y, 12 * scale, 0, 2 * Math.PI)
      ctx.fill()

      const inner = color.get(data.expr).get()
      ctx.beginPath()
      ctx.fillStyle = "#6042a6"
      ctx.arc(offset.x, offset.y, inner * scale, 0, 2 * Math.PI)
      ctx.fill()
    }
  },
  layer() {
    return 2
  },
  drag: {
    start(data, at) {
      if (data.value.list !== false) {
        return
      }
      if (
        data.paper.canvasDistance(at, unpt(data.value.value)) <=
        12 * data.paper.scale
      ) {
        color.get(data.expr).set(12)
        return {
          expr: data.expr,
          paper: data.paper,
          name:
            data.expr.field.ast.type == "binding" ?
              data.expr.field.ast.name
            : null,
        }
      }
    },
    cursor() {
      return "move"
    },
    move(data, to) {
      const { block } = data.expr.field
      block.clear()
      if (data.name) {
        CmdVar.leftOf(block.cursor(R), data.name, data.expr.field.options)
        new OpEq(false).insertAt(block.cursor(R), L)
      }
      const inner = new Block(null)
      new CmdBrack("(", ")", null, inner).insertAt(block.cursor(R), L)
      const display = new Display(inner.cursor(R), frac(10, 1))
      display.value(to.x)
      new CmdComma().insertAt(inner.cursor(R), L)
      display.value(to.y)
      data.expr.field.sel = data.expr.field.block.cursor(R).selection()
      data.expr.field.queueAstUpdate()
    },
    end(data) {
      color.get(data.expr).set(3.5)
    },
  },
  hover: {
    on(data, at) {
      if (data.value.list !== false) {
        return
      }
      if (
        data.paper.canvasDistance(at, unpt(data.value.value)) <=
        12 * data.paper.scale
      ) {
        color.get(data.expr).set(12)
        return data
      }
    },
    cursor() {
      return "move"
    },
    off(data) {
      color.get(data.expr).set(3.5)
    },
  },
})
