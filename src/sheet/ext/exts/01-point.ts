import { defineExt, Store } from ".."
import type { Node } from "../../../eval/ast/token"
import { each, type JsValue } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { R } from "../../../field/model"
import { Transition } from "../../transition"
import { Writer } from "../../write"
import { EXT_EVAL } from "./02-eval"

const color = new Store(
  (expr) => new Transition(3.5, () => expr.sheet.paper.queue()),
)

export function draggerNum(node: Node) {
  if (node.type == "num") {
    return node.span
  }
}

export function draggers(node: Node) {
  if (node.type == "binding") {
    node = node.value
  }

  if (
    node.type == "group" &&
    node.lhs == "(" &&
    node.rhs == ")" &&
    node.value.type == "commalist" &&
    node.value.items.length == 2
  ) {
    const x = draggerNum(node.value.items[0]!)
    const y = draggerNum(node.value.items[1]!)
    if (x && y) return { x: new Writer(x), y: new Writer(y) }
    return
  }

  if (
    node.type == "op" &&
    node.kind == "+" &&
    node.a.type == "num" &&
    node.a.span &&
    node.b?.type == "juxtaposed" &&
    node.b.nodes.length == 2 &&
    node.b.nodes[0]!.type == "num" &&
    node.b.nodes[0]!.span &&
    node.b.nodes[1]!.type == "var" &&
    node.b.nodes[1]!.kind == "var" &&
    node.b.nodes[1]!.value == "i" &&
    !node.b.nodes[1]!.sub &&
    !node.b.nodes[1]!.sup
  ) {
    return { x: new Writer(node.a.span), y: new Writer(node.b.nodes[0]!.span) }
  }
}

export const EXT_POINT = defineExt({
  data(expr) {
    const value = expr.js?.value
    const drag = draggers(expr.field.ast)

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
          x: data.drag.x,
          y: data.drag.y,
        }
      }
    },
    cursor() {
      return "move"
    },
    move(data, to) {
      data.x.set(to.x, data.paper.el.width / data.paper.bounds().w)
      data.y.set(to.y, data.paper.el.height / data.paper.bounds().h)
      data.expr.field.sel = data.expr.field.block.cursor(R).selection()
      data.expr.field.queueAstUpdate()
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
