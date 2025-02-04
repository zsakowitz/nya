import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning"
import { fa } from "../../../field/fa"
import { h } from "../../../jsx"
import type { Ext } from "../../ext"
import type { Sheet } from "../sheet"
import { Field } from "./field"

export type ExprState =
  | { ok: false; reason: string }
  | { ok: true; ext: Ext<{}> | null; data: {} }

export class Expr {
  readonly field
  readonly el
  readonly elIndex
  readonly elOutput
  readonly elError

  state: ExprState = { ok: false, reason: "Not computed yet." }

  constructor(readonly sheet: Sheet) {
    sheet.exprs.push(this)
    sheet.queueIndices()
    this.el = h(
      "grid grid-cols-[2.5rem_auto] border-r border-b border-[--nya-border] relative nya-expr",
    )
    this.field = new Field(
      this,
      "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] max-w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] p-4 focus:outline-none",
    )
    this.elOutput = h("contents")
    this.elError = h(
      "block hidden mx-1 -mt-2 px-1 pb-1 leading-tight italic text-[--nya-expr-error] whitespace-pre-wrap font-sans pointer-events-none",
    )

    this.el.append(
      // grey side of expression
      h(
        "inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border] font-sans text-[--nya-expr-index] text-[65%] leading-none [:focus-within>&]:bg-[--nya-expr-focus] [:focus-within>&]:text-[--nya-expr-focus-index] [:focus-within>&]:border-[--nya-expr-focus]",
        (this.elIndex = h("")),
        fa(
          faWarning,
          "hidden mx-auto size-6 fill-[--nya-icon-error] [.nya-expr-error_&]:block",
        ),
      ),

      // main expression body
      h("flex flex-col", this.field.el, this.elOutput, this.elError),

      // focus ring
      h(
        "hidden absolute -inset-y-px inset-x-0 [:first-child>&]:top-0 border-2 border-[--nya-expr-focus] [:focus-within>&]:block pointer-events-none",
      ),
    )
    this.sheet.elExpressions.appendChild(this.el)
  }

  compute() {
    this.state = { ok: false, reason: "Currently computing." }

    try {
      for (const ext of this.sheet.exts.exts) {
        const data = ext.data(this)
        if (data != null) {
          this.state = { ok: true, ext, data }
          return
        }
      }
      this.state = { ok: true, ext: null, data: {} }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn("[compute]", msg)
      this.state = { ok: false, reason: msg }
    }
  }

  display() {
    if (!this.state.ok) {
      while (this.elOutput.firstChild) {
        this.elOutput.firstChild.remove()
      }
      this.elError.classList.remove("hidden")
      this.elError.textContent = this.state.reason
      return
    }

    if (this.state.ext == null) {
      this.elError.classList.add("hidden")
      while (this.elOutput.firstChild) {
        this.elOutput.firstChild.remove()
      }
      return
    }

    try {
      this.elError.classList.add("hidden")
      this.el.classList.remove("nya-expr-error")

      const el = this.state.ext.el?.({ expr: this, data: this.state.data })
      if (el != this.elOutput.firstChild) {
        while (this.elOutput.firstChild) {
          this.elOutput.firstChild.remove()
        }
      }
      if (el) {
        this.elOutput.appendChild(el)
      }
    } catch (e) {
      while (this.elOutput.firstChild) {
        this.elOutput.firstChild.remove()
      }
      const msg = e instanceof Error ? e.message : String(e)
      console.warn("[display]", msg)
      this.elError.classList.remove("hidden")
      this.elError.textContent = msg
      this.state = { ok: false, reason: msg }
    }
  }
}
