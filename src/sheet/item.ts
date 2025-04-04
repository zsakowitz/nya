import type { GlslResult } from "@/eval/lib/fn"
import { LatexParser } from "@/field/latex"
import { Block, L, R, U, type VDir } from "@/field/model"
import {
  faSquareRootVariable,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons"
import type { ItemRef } from "./items"
import type { Plottable } from "./ui/cv/item"
import type { ItemData } from "./ui/cv/move"
import { Expr, type ExprStateOk } from "./ui/expr"

export interface ItemFactory<T, U = unknown, V = unknown> {
  id: string
  name: string
  icon: IconDefinition
  group?: boolean

  /** The passed {@linkcode ItemRef} is mostly uninitialized. */
  init(ref: ItemRef<T>, source: string | undefined, from: U | undefined): T
  aside?(data: T): Node
  main(data: T): Node
  plot?: Plottable<T, V>
  glsl?(data: T): GlslResult | undefined
  unlink(data: T): void
  /** `from` is only `null` immediately after creation. */
  focus(data: T, from: VDir | null): void
  encode(data: T): string
  error?(data: T, message: string): void

  /**
   * Defaults to zero; if two items are loaded with the same ID, the higher one
   * wins. If the same layer is added twice, the earlier one wins.
   */
  layer?: number
}

export type AnyItemFactory = ItemFactory<unknown>

type K = { readonly __unique_id: unique symbol }

function local(data: ItemData<Expr<K>, unknown>): ItemData<K> {
  return {
    data: (data.data.state as ExprStateOk<K>).data!,
    index: data.index,
    item: data.item,
  }
}

export const FACTORY_EXPR: ItemFactory<Expr<K>, { geo?: boolean }> = {
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
    return expr as Expr<K>
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
      const state = data.state as ExprStateOk<K>
      state.ext!.plot!.draw(state.data!, item, index)
    },
    target: {
      hits(data, at, hint) {
        const state = data.data.state as ExprStateOk<K>
        return !!state.ext!.plot!.target?.hits(local(data), at, hint)
      },
      focus(data) {
        const state = data.state as ExprStateOk<K>
        state.ext?.plot?.target?.focus(state.data!)
      },
      toggle(item, on, reason) {
        const state = item.data.state as ExprStateOk<K>
        state.ext?.plot?.target!.toggle(local(item), on, reason)
      },
      ref(item) {
        const state = item.data.state as ExprStateOk<K>
        return state.ext?.plot?.target!.ref(local(item)) ?? new Block(null)
      },
      val(item) {
        const state = item.data.state as ExprStateOk<K>
        return (
          state.ext?.plot?.target!.val(local(item)) ?? {
            type: "never",
            value: "__never",
          }
        )
      },
      dragOrigin(item) {
        const state = item.data.state as ExprStateOk<K>
        return state.ext?.plot?.target!.dragOrigin?.(local(item)) ?? null
      },
      drag(item, at) {
        const state = item.data.state as ExprStateOk<K>
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
