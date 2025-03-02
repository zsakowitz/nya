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

  /** The passed {@linkcode ItemRef} is mostly uninitialized. */
  init(ref: ItemRef<T>, source: string | undefined, from: U | undefined): T
  /** The number of indicies this item takes up. */
  size?(data: T): number
  el(data: T): HTMLElement
  draw?(data: T): void
  glsl?(data: T): GlslResult | undefined
  unlink(data: T): void
  focus(data: T, from?: VDir): void
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

  init(ref, source, props) {
    const expr = new Expr(ref.list.sheet, ref, !!props?.geo)
    if (source) {
      expr.field.onBeforeChange()
      const block = new LatexParser(
        ref.list.sheet.options,
        ref.list.sheet.scope.ctx,
        source,
        expr.field,
      ).parse()
      expr.field.block.insert(block, null, null)
      expr.field.sel = expr.field.block.cursor(R).selection()
      expr.field.onAfterChange(false)
    }
    return expr
  },
  el(data) {
    return data.el
  },
  draw(expr) {
    if (expr.state.ok && expr.state.ext?.svg) {
      expr.state.ext.svg(expr.state.data, expr.sheet.paper)
    }
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
