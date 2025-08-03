import { L, R, U } from "@/field/dir"
import { LatexParser } from "@/field/latex"
import { faSquareRootVariable } from "@fortawesome/free-solid-svg-icons"
import type { ItemFactory } from "./item"
import { Order } from "./ui/cv/consts"
import type { Expr } from "./ui/expr"

export const FACTORY_EXPR: ItemFactory<Expr, { geo?: boolean }> = {
  id: "nya:expr",
  name: "field",
  icon: faSquareRootVariable,
  init(ref, source) {
    const expr: Expr = (ref.root.sheet as any)._createExprWithRef(ref)
    if (source) {
      expr.field.onBeforeChange()
      const block = new LatexParser(
        ref.root.sheet.options,
        ref.root.sheet.scope,
        source,
      ).parse()
      expr.field.block.insert(block, null, null)
      expr.field.sel = expr.field.block.cursor(R).selection()
      expr.field.onAfterChange(false)
    }
    return expr as Expr
  },
  aside(data) {
    return data.aside
  },
  main(data) {
    return data.main
  },
  plot: {
    order() {
      return Order.Graph
    },
    items(data) {
      return data.plot || data.lastObjs ? [1] : []
    },
    draw(data) {
      data.drawSelf()
    },
  },
  glsl(data) {
    return data.glsl
  },
  unlink(data) {
    data.unlink()
  },
  focus(data, from) {
    if (from) {
      data.field.onBeforeChange()
      data.field.sel = data.field.block.cursor(from == U ? L : R).selection()
      data.field.onAfterChange(true)
    }
    data.field.el.focus()
  },
  error(data, message) {
    data.setError(message)
  },

  encode(data) {
    return data.field.block.latex()
  },

  layer: -1,
}
