import { defineExt, Store } from ".."
import { dragPoint } from "../../../eval/ast/tx"
import { each, type JsValue } from "../../../eval/ty"
import { frac, real, unpt } from "../../../eval/ty/create"
import { TY_INFO } from "../../../eval/ty/info"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { Block, L, R } from "../../../field/model"
import { Transition } from "../../transition"
import type { Paper, Point } from "../../ui/paper"
import { virtualStepExp, write, Writer } from "../../write"
import { EXT_EVAL } from "./02-eval"

const color = new Store(
  (expr) => new Transition(3.5, () => expr.sheet.paper.queue()),
)

export function drawPoint(paper: Paper, at: Point, size = 3.5, halo?: boolean) {
  const offset = paper.paperToCanvas(at)
  if (!(isFinite(offset.x) && isFinite(offset.y))) return
  const { ctx, scale } = paper

  if (halo) {
    ctx.beginPath()
    ctx.fillStyle = "#6042a659"
    ctx.arc(offset.x, offset.y, 12 * scale, 0, 2 * Math.PI)
    ctx.fill()
  }

  ctx.beginPath()
  ctx.fillStyle = "#6042a6"
  ctx.arc(offset.x, offset.y, size * scale, 0, 2 * Math.PI)
  ctx.fill()
}

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
      drawPoint(paper, unpt(pt), color.get(data.expr).get(), !!data.drag)
    }
  },
  layer() {
    return 3
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
    cursor(data) {
      if (data.drag.type == "split") {
        return (
          data.drag.x && !data.drag.y ? "ew-resize"
          : data.drag.y && !data.drag.x ? "ns-resize"
          : "move"
        )
      }

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
    cursor(data) {
      const drag = data.drag!

      if (drag.type == "split") {
        return (
          drag.x && !drag.y ? "ew-resize"
          : drag.y && !drag.x ? "ns-resize"
          : "move"
        )
      }

      return "move"
    },
    off(data) {
      color.get(data.expr).set(3.5)
    },
  },
  select: {
    ty(data) {
      return data.value.type
    },
    on(data, at) {
      if (data.value.list !== false) {
        return
      }

      if (
        data.paper.canvasDistance(at, unpt(data.value.value)) <=
        12 * data.paper.scale
      ) {
        return { ...data, value: data.value }
      }
    },
    val(data) {
      return data.value
    },
    ref(data) {
      if (data.expr.field.ast.type == "binding") {
        const block = new Block(null)
        CmdVar.leftOf(
          block.cursor(R),
          data.expr.field.ast.name,
          data.expr.field.options,
        )
        return block
      }

      const name = data.expr.sheet.scope.name("p")
      const c = data.expr.field.block.cursor(L)
      CmdVar.leftOf(c, name, data.expr.field.options)
      new OpEq(false).insertAt(c, L)
      const block = new Block(null)
      CmdVar.leftOf(block.cursor(R), name, data.expr.field.options)
      data.expr.field.dirtyAst = data.expr.field.dirtyValue = true
      data.expr.field.trackNameNow()
      data.expr.field.scope.queueUpdate()

      return block
    },
  },
})
