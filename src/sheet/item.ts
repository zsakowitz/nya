import type { GlslResult } from "../eval/lib/fn"
import { LatexParser } from "../field/latex"
import { L, R, U, type VDir } from "../field/model"
import { t } from "../jsx"
import type { ItemRef } from "./items"
import { Expr } from "./ui/expr"

export interface ItemFactory<T> {
  id: string
  name: string
  icon(): Node

  /** The passed {@linkcode ItemRef} is mostly uninitialized. */
  init(ref: ItemRef<T>): T
  el(data: T): HTMLElement
  draw(data: T): void
  glsl(data: T): GlslResult | undefined
  unlink(data: T): void

  focus(data: T, from?: VDir): void

  encode(data: T): string
  /** The passed {@linkcode ItemRef} is mostly uninitialized. */
  decode(ref: ItemRef<T>, source: string): T

  /**
   * Defaults to zero; if two items are loaded with the same ID, the higher one
   * wins. If the same layer is added twice, the earlier one wins.
   */
  layer?: number
}

export type AnyItemFactory = ItemFactory<unknown>

export const FACTORY_EXPR: ItemFactory<Expr> = {
  id: "nya:expr",
  name: "expression",
  icon() {
    return t("f(x)")
  },

  init(ref) {
    return new Expr(ref.list.sheet, ref)
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
  decode(ref, source) {
    const expr = new Expr(ref.list.sheet, ref)
    expr.field.onBeforeChange()
    const block = new LatexParser(
      ref.list.sheet.options,
      source,
      expr.field,
    ).parse()
    expr.field.block.insert(block, null, null)
    expr.field.sel = expr.field.block.cursor(R).selection()
    expr.field.onAfterChange(false)
    return expr
  },

  layer: -1,
}
