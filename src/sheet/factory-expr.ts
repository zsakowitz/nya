import { LatexParser } from "@/field/latex"
import { Block } from "@/field/model"
import { L, R, U } from "@/field/sides"
import { faSquareRootVariable } from "@fortawesome/free-solid-svg-icons"
import type { ItemFactory } from "./item"
import type { ItemData } from "./ui/cv/move"
import { Expr, type ExprStateOk } from "./ui/expr"

function local(data: ItemData<Expr, unknown>): ItemData<{}> {
  return {
    data: (data.data.state as ExprStateOk).data!,
    index: data.index,
    item: data.item,
  }
}

export const FACTORY_EXPR: ItemFactory<Expr, { geo?: boolean }> = {
  id: "nya:expr",
  name: "field",
  icon: faSquareRootVariable,

  init(ref, source) {
    const expr = new Expr(ref.root.sheet, ref)
    if (source) {
      expr.field.onBeforeChange()
      const block = new LatexParser(
        ref.root.sheet.options,
        ref.root.sheet.scope,
        source,
        expr.field,
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
    order(data) {
      if (data.state.ok && data.state.ext?.plot) {
        return data.state.ext.plot.order(data.state.data)
      }

      return null
    },
    items(data) {
      return data.state.ext?.plot?.items(data.state.data) ?? []
    },
    draw(data, item, index) {
      // This cast is safe since it wouldn't be called unless `items` returned.
      const state = data.state as ExprStateOk
      state.ext!.plot!.draw(state.data!, item, index)
    },
    target: {
      hits(data, at, hint) {
        const state = data.data.state as ExprStateOk
        return !!state.ext!.plot!.target?.hits(local(data), at, hint)
      },
      focus(data) {
        const state = data.state as ExprStateOk
        state.ext?.plot?.target?.focus(state.data!)
      },
      toggle(item, on, reason) {
        const state = item.data.state as ExprStateOk
        state.ext?.plot?.target!.toggle(local(item), on, reason)
      },
      ref(item) {
        const state = item.data.state as ExprStateOk
        return state.ext?.plot?.target!.ref(local(item)) ?? new Block(null)
      },
      val(item) {
        const state = item.data.state as ExprStateOk
        return (
          state.ext?.plot?.target!.val(local(item)) ?? {
            type: "never",
            value: "__never",
          }
        )
      },
      dragOrigin(item) {
        const state = item.data.state as ExprStateOk
        return state.ext?.plot?.target!.dragOrigin?.(local(item)) ?? null
      },
      drag(item, at) {
        const state = item.data.state as ExprStateOk
        return state.ext?.plot?.target!.drag!(local(item), at)
      },
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
