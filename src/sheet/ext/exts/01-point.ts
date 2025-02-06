import { defineExt, Store } from ".."
import { dragPoint } from "../../../eval/tx"
import { each, type JsValue } from "../../../eval/ty"
import { frac, num, real, unpt } from "../../../eval/ty/create"
import { TY_INFO } from "../../../eval/ty/info"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { L, R } from "../../../field/model"
import { Transition } from "../../transition"
import { virtualStepExp, write, Writer } from "../../write"
import { EXT_EVAL } from "./02-eval"

const color = new Store(
  (expr) => new Transition(3.5, () => expr.sheet.paper.queue()),
)

export const EXT_POINT = defineExt({
  data(expr) {
    const value = expr.js?.value

    let node = expr.field.ast
    if (node.type == "binding") node = node.value

    const drag = dragPoint(node, expr.sheet.scope.propsDrag(expr.field))

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
        drag,
      }
    }
  },
  el(data) {
    return EXT_EVAL.el!(EXT_EVAL.data(data.expr)!)
  },
  plot2d(data, paper) {
    for (const pt of each(data.value)) {
      const x = num(pt.x)
      const y = num(pt.y)
      if (!(isFinite(x) && isFinite(y))) continue

      const offset = paper.paperToCanvas({ x, y })
      const { ctx, scale } = paper

      if (data.drag) {
        ctx.beginPath()
        ctx.fillStyle = "#6042a659"
        ctx.arc(offset.x, offset.y, 12 * scale, 0, 2 * Math.PI)
        ctx.fill()
      }

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
      if (!data.drag || data.value.list !== false) {
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
          drag: data.drag,
        }
      }
    },
    cursor() {
      return "move"
    },
    move(data, to) {
      const { drag } = data

      switch (drag.type) {
        case "split":
          if (drag.x) {
            new Writer(drag.x.span.remove().span()).set(
              to.x,
              data.paper.el.width / data.paper.bounds().w,
              drag.x.signed,
            )
            drag.x.field.sel = drag.x.field.block.cursor(R).selection()
            drag.x.field.queueAstUpdate()
          }

          if (drag.y) {
            new Writer(drag.y.span.remove().span()).set(
              to.y,
              data.paper.el.height / data.paper.bounds().h,
              drag.y.signed,
            )
            drag.y.field.sel = drag.y.field.block.cursor(R).selection()
            drag.y.field.queueAstUpdate()
          }

          break
        case "complex":
          {
            const x = to.x
            const xp = data.paper.el.width / data.paper.bounds().w
            const y = to.y
            const yp = data.paper.el.height / data.paper.bounds().h
            const cursor = drag.span.remove()
            write(cursor, real(x), frac(10, 1), virtualStepExp(xp, 10), false)
            write(cursor, real(y), frac(10, 1), virtualStepExp(yp, 10), true)
            new CmdVar("i", data.expr.field.options).insertAt(cursor, L)
            drag.field.sel = drag.field.block.cursor(R).selection()
            drag.field.queueAstUpdate()
          }
          break
        case "glider":
          {
            const { value, precision } = TY_INFO[drag.shape.type].glide!({
              paper: data.paper,
              point: to,
              shape: drag.shape.value as never,
            })
            new Writer(drag.value.span.remove().span()).set(value, precision)
            drag.value.field.sel = drag.value.field.block.cursor(R).selection()
            drag.value.field.queueAstUpdate()
          }
          break
      }
    },
    end(data) {
      color.get(data.expr).set(3.5)
    },
  },
  hover: {
    on(data, at) {
      if (!data.drag || data.value.list !== false) {
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
