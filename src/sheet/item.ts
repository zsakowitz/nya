import {
  faSquareRootVariable,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons"
import type { GlslResult } from "../eval/lib/fn"
import { LatexParser } from "../field/latex"
import { L, R, U, type VDir } from "../field/model"
import { h } from "../jsx"
import type { ItemRef } from "./items"
import { Expr } from "./ui/expr"

export interface ItemFactory<T, U = unknown> {
  id: string
  name: string
  icon: IconDefinition

  /** The passed {@linkcode ItemRef} is mostly uninitialized. */
  init(ref: ItemRef<T>, source: string | undefined, from: U | undefined): T
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
    // TODO: put geo items in a separated region
    return data.geo ?
        ((data.field.el.className =
          "nya-display cursor-text whitespace-nowrap font-['Symbola','Times_New_Roman',serif] text-[1.265em] font-normal not-italic [line-height:1] cursor-text block select-none inline-block pb-1 pt-1.5 px-4 focus:outline-none"),
        h(
          "grid grid-cols-[2.5rem_auto] border-r border-b relative nya-expr border-[--nya-border]",
          h(
            "nya-expr-bar inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border] font-sans text-[--nya-expr-index] text-[65%] leading-none focus:outline-none",
            data.ref.elIndex,
          ),
          data.field.el,
          h(
            "hidden absolute -inset-y-px inset-x-0 [:first-child>&]:top-0 border-2 border-[--nya-expr-focus] pointer-events-none [:focus-within>&]:block [:active>&]:block",
          ),
        ))
      : data.el
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
