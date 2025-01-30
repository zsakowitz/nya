import { twMerge } from "tailwind-merge"
import type { PlainVar } from "../../../eval/ast/token"
import { glsl } from "../../../eval/glsl"
import { js } from "../../../eval/js"
import { id } from "../../../eval/lib/binding"
import type { GlslContext } from "../../../eval/lib/fn"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../../../eval/ops/vars"
import type { GlslValue, JsValue } from "../../../eval/ty"
import { h } from "../../../jsx"
import type { Sheet } from "../sheet"
import { Field } from "./field"

export type ExprState =
  | { type: "error"; reason: string }
  | { type: "slider"; name: PlainVar }
  | { type: "js"; value: JsValue }
  | { type: "glsl"; ctx: GlslContext; value: GlslValue }

const ID_X = id({ value: "x" })
const ID_Y = id({ value: "y" })
const ID_P = id({ value: "p" })

export class Expr {
  readonly field
  readonly el
  readonly elIndex = h("font-sans text-slate-500 text-[65%] leading-none", "1")

  state: ExprState = { type: "error", reason: "Not computed yet." }

  constructor(readonly sheet: Sheet) {
    this.field = new Field(this)
    this.field.el.classList.add("p-4")
    this.el = h(
      "grid grid-cols-[2.5rem_auto] border-r border-b border-slate-200",

      // grey side of expression
      h(
        "inline-flex bg-slate-100 flex-col p-0.5 border-r border-slate-200",
        this.elIndex,
      ),

      // main expression body
      h("flex flex-col", this.field.el),
    )
    this.field.el.className = twMerge(
      this.field.el.className,
      "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] max-w-[calc(var(--nya-sidebar)_-_2.5rem)]",
    )
    this.sheet.elExpressions.appendChild(this.el)
  }

  recompute() {
    this.state = { type: "error", reason: "Currently computing." }

    let node = this.field.ast

    if (node.type == "binding" && !node.args && node.value.type == "num") {
      this.state = { type: "slider", name: node.name }
    }

    if (node.type == "binding") {
      node = node.value
    }

    js: if (
      !(
        this.field.deps.isBound(ID_X) &&
        this.field.deps.isBound(ID_Y) &&
        this.field.deps.isBound(ID_P)
      )
    ) {
      try {
        const value = js(node, this.sheet.scope.propsJs)
        this.state = { type: "js", value }
        return
      } catch (e) {
        if (e instanceof Error && e.message == ERR_COORDS_USED_OUTSIDE_GLSL) {
          break js
        }

        console.warn("[expr eval js]", e)
        const msg = e instanceof Error ? e.message : String(e)
        this.state = { type: "error", reason: msg }
        return
      }
    }

    try {
      const props = this.sheet.scope.propsGlsl()
      const value = glsl(node, props)
      this.state = { type: "glsl", ctx: props.ctx, value }
    } catch (e) {
      console.warn("[expr eval glsl]", e)
      const msg = e instanceof Error ? e.message : String(e)
      this.state = { type: "error", reason: msg }
    }
  }
}
