import {
  faSquareRootVariable,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons"
import type { GlslResult } from "../eval/lib/fn"
import { LatexParser } from "../field/latex"
import { L, R, U, type VDir } from "../field/model"
import type { ItemRef } from "./items"
import { Expr } from "./ui/expr"

export interface ItemFactory<T, U = unknown> {
  id: string
  name: string
  icon: IconDefinition
  group?: boolean

  /** The passed {@linkcode ItemRef} is mostly uninitialized. */
  init(ref: ItemRef<T>, source: string | undefined, from: U | undefined): T
  aside?(data: T): Node
  main(data: T): Node
  draw3?: { order(data: T): number | null; draw(data: T): void } // FIXME: no -3
  glsl?(data: T): GlslResult | undefined
  unlink(data: T): void
  /** `from` is only `null` immediately after creation. */
  focus(data: T, from: VDir | null): void
  encode(data: T): string

  /**
   * Defaults to zero; if two items are loaded with the same ID, the higher one
   * wins. If the same layer is added twice, the earlier one wins.
   */
  layer?: number
}

export type AnyItemFactory = ItemFactory<unknown>

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
        ref.root.sheet.scope.ctx,
        source,
        expr.field,
      ).parse()
      expr.field.block.insert(block, null, null)
      expr.field.sel = expr.field.block.cursor(R).selection()
      expr.field.onAfterChange(false)
    }
    return expr
  },
  aside(data) {
    return data.aside
  },
  main(data) {
    return data.main
  },
  draw3: {
    order(data) {
      if (data.state.ok && data.state.ext?.plot) {
        return data.state.ext.plot.order
      }
      return null
    },
    draw(data) {
      if (data.state.ok && data.state.ext?.plot) {
        data.state.ext.plot.draw(data.state.data)
      }
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

  encode(data) {
    return data.field.block.latex()
  },

  layer: -1,
}
