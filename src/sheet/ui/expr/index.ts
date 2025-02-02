import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning"
import { glsl } from "../../../eval/glsl"
import { js } from "../../../eval/js"
import { id } from "../../../eval/lib/binding"
import type { GlslContext } from "../../../eval/lib/fn"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../../../eval/ops/vars"
import type { GlslValue, JsValue, SReal } from "../../../eval/ty"
import { frac, num } from "../../../eval/ty/create"
import { Display, outputBase } from "../../../eval/ty/display"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { fa } from "../../../field/fa"
import { FieldInert } from "../../../field/field-inert"
import { R } from "../../../field/model"
import { h, t } from "../../../jsx"
import type { Sheet } from "../sheet"
import { Field } from "./field"
import { RangeControls, type ExprRangeState } from "./range"
import { readSlider } from "./range/scrubber"

export type ExprState =
  | { type: "error"; reason: string }
  | { type: "js"; value: JsValue; base: SReal }
  | { type: "glsl"; ctx: GlslContext; value: GlslValue }
  | ExprRangeState

const ID_X = id({ value: "x" })
const ID_Y = id({ value: "y" })
const ID_P = id({ value: "p" })

export class Expr {
  readonly field
  readonly el
  readonly elIndex = t("1")

  readonly slider
  readonly value
  readonly elValue
  readonly elError

  state: ExprState = { type: "error", reason: "Not computed yet." }

  constructor(readonly sheet: Sheet) {
    this.el = h(
      "grid grid-cols-[2.5rem_auto] border-r border-b border-[--nya-border] relative nya-expr",
    )
    this.slider = new RangeControls(this)
    this.field = new Field(
      this,
      "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] max-w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] p-4 focus:outline-none",
    )
    this.value = new FieldInert(
      sheet.exts,
      sheet.options,
      "bg-[--nya-bg-sidebar] border border-[--nya-border] px-2 py-1 rounded",
    )
    this.elValue = h(
      "flex px-2 pb-2 -mt-2 w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] overflow-x-auto [&::-webkit-scrollbar]:hidden hidden justify-end",
      this.value.el,
    )
    this.elError = h(
      "block hidden mx-1 -mt-2 px-1 pb-1 leading-tight italic text-[--nya-expr-error] whitespace-pre-wrap font-sans pointer-events-none",
    )

    this.el.append(
      // grey side of expression
      h(
        "inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border] font-sans text-[--nya-expr-index] text-[65%] leading-none [:focus-within>&]:bg-[--nya-expr-focus] [:focus-within>&]:text-[--nya-expr-focus-index] [:focus-within>&]:border-[--nya-expr-focus]",
        this.elIndex,
        fa(
          faWarning,
          "hidden mx-auto size-6 fill-[--nya-icon-error] [.nya-expr-error_&]:block",
        ),
      ),

      // main expression body
      h(
        "flex flex-col",
        this.field.el,
        this.elValue,
        this.elError,
        this.slider.el,
      ),

      // focus ring
      h(
        "hidden absolute -inset-y-px inset-x-0 [:first-child>&]:top-0 border-2 border-[--nya-expr-focus] [:focus-within>&]:block pointer-events-none",
      ),
    )
    this.sheet.elExpressions.appendChild(this.el)
  }

  compute() {
    this.state = { type: "error", reason: "Currently computing." }

    try {
      let node = this.field.ast

      if (node.type == "binding" && !node.args) {
        const sv = readSlider(node.value)
        if (sv) {
          this.state = { ...sv, type: "range", name: node.name }
          this.slider.scrubber.base = sv.base || frac(10, 1)
          return
        }
      }

      if (node.type == "binding") {
        node = node.value
      }

      if (
        !(
          this.field.deps.isBound(ID_X) &&
          this.field.deps.isBound(ID_Y) &&
          this.field.deps.isBound(ID_P)
        )
      ) {
        try {
          this.state = {
            type: "js",
            value: js(node, this.sheet.scope.propsJs),
            base: outputBase(node, this.sheet.scope.propsJs),
          }
          return
        } catch (e) {
          if (
            !(e instanceof Error && e.message == ERR_COORDS_USED_OUTSIDE_GLSL)
          ) {
            throw e
          }
        }
      }

      const props = this.sheet.scope.propsGlsl()
      const value = glsl(node, props)
      this.state = { type: "glsl", ctx: props.ctx, value }
    } catch (e) {
      console.warn("[expr eval]")
      const msg = e instanceof Error ? e.message : String(e)
      this.state = { type: "error", reason: msg }
    }
  }

  display() {
    this.elValue.classList.add("hidden")
    this.elError.classList.add("hidden")
    this.el.classList.remove("nya-expr-error")
    if (this.state.type == "range") {
      if (num(this.state.value) != num(this.slider.scrubber.value)) {
        this.slider.scrubber.value = this.state.value
      }
      this.slider.relink()
      this.slider.name.block.clear()
      CmdVar.leftOf(
        this.slider.name.block.cursor(R),
        this.state.name,
        this.field.options,
      )
      this.state.name
      if (
        typeof this.slider.min.value == "string" ||
        typeof this.slider.max.value == "string" ||
        typeof this.slider.step.value == "string"
      ) {
        this.el.classList.add("nya-expr-error")
      }
      this.slider.el.classList.remove("hidden")
      return
    }

    this.slider.el.classList.add("hidden")
    this.slider.unlink()

    switch (this.state.type) {
      case "error":
        this.el.classList.add("nya-expr-error")
        this.elError.classList.remove("hidden")
        this.elError.textContent = this.state.reason
        break
      case "js":
        this.value.block.clear()
        const cursor = this.value.block.cursor(R)
        new Display(cursor, this.state.base).output(this.state.value)
        this.elValue.classList.remove("hidden")
        break
      case "glsl":
    }
  }
}
