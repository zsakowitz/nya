import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning"
import { js } from "../../../eval/js"
import { id } from "../../../eval/lib/binding"
import type { GlslResult } from "../../../eval/lib/fn"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../../../eval/ops/vars"
import type { JsValue, SReal } from "../../../eval/ty"
import { outputBase } from "../../../eval/ty/display"
import { fa } from "../../../field/fa"
import { h } from "../../../jsx"
import type { AnyExt } from "../../ext"
import { FACTORY_EXPR } from "../../item"
import type { ItemRef } from "../../items"
import { PICK_CURSOR } from "../../pick-cursor"
import type { Sheet } from "../sheet"
import { Field } from "./field"

const ID_X = id({ value: "x" })
const ID_Y = id({ value: "y" })
const ID_P = id({ value: "p" })

type ExprState =
  | { ok: false; reason: string }
  | { ok: true; ext: AnyExt | null; data: {} }

export class Expr {
  static of(sheet: Sheet, geo?: boolean) {
    return sheet.list.create(FACTORY_EXPR, { from: { geo } }).data
  }

  readonly field
  private readonly elOutput
  private readonly elAside
  private readonly elError
  readonly aside
  readonly main

  state: ExprState = { ok: false, reason: "Not computed yet." }

  constructor(
    readonly sheet: Sheet,
    readonly ref: ItemRef<Expr>,
    readonly geo: boolean,
  ) {
    this.field = new Field(
      this,
      "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] max-w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] p-4 focus:outline-none",
    )
    this.elOutput = h("contents")
    this.elError = h(
      "block hidden mx-1 -mt-2 px-1 pb-1 leading-tight italic text-[--nya-expr-error] whitespace-pre-wrap font-sans pointer-events-none",
    )
    this.aside = h(
      "contents",
      fa(
        faWarning,
        "hidden mb-1.5 mx-auto size-6 fill-[--nya-icon-error] [.nya-expr-error_&]:block",
      ),
      (this.elAside = h("contents")),
    )

    this.main = h("flex flex-col", this.field.el, this.elOutput, this.elError)

    this.field.el.addEventListener("keydown", (event) => {
      if (event.key == "Enter" && !event.ctrlKey && !event.metaKey) {
        this.ref.list.create(FACTORY_EXPR, {
          at: this.ref.index() + 1,
          focus: true,
        })
      }

      if (event.key == "Shift") {
        sheet.pick.set(PICK_CURSOR, { expr: this, ref: this.ref })
      }
    })
  }

  js: { value: JsValue; base: SReal } | undefined
  computeJs() {
    this.js = undefined

    if (
      this.field.deps.isBound(ID_X) ||
      this.field.deps.isBound(ID_Y) ||
      this.field.deps.isBound(ID_P)
    ) {
      return
    }

    try {
      let ast = this.field.ast
      if (ast.type == "binding") {
        ast = ast.value
      }

      const value = js(ast, this.field.scope.propsJs)
      const base = outputBase(ast, this.field.scope.propsJs)
      this.js = { value, base }
    } catch (e) {
      if (!(e instanceof Error && e.message == ERR_COORDS_USED_OUTSIDE_GLSL)) {
        throw e
      }
    }
  }

  compute() {
    let destroyed = false

    if (this.field.error != null) {
      if (!destroyed) {
        if (this.state.ok && this.state.ext) {
          this.state.ext.destroy?.(this.state.data)
        }
        if (this.state.ok && this.state.ext?.svg) {
          this.sheet.paper.queue()
        }
      }
      this.state = { ok: false, reason: this.field.error }
      return
    }

    if (this.field.ast.type == "binding" && this.field.ast.params) {
      this.state = { ok: true, ext: null, data: {} }
      return
    }

    try {
      this.computeJs()

      for (const ext of this.sheet.exts.exts) {
        const data = ext.data(this)
        if (data != null) {
          if (this.state.ok && this.state.ext && this.state.ext != ext) {
            this.state.ext.destroy?.(this.state.data)
          }
          if (this.state.ok && this.state.ext?.svg) {
            this.sheet.paper.queue()
          }
          destroyed = true
          this.state = { ok: true, ext, data }
          if (ext.svg) {
            this.sheet.paper.queue()
          }
          return
        }
      }

      if (this.state.ok && this.state.ext) {
        this.state.ext.destroy?.(this.state.data)
      }
      if (this.state.ok && this.state.ext?.svg) {
        this.sheet.paper.queue()
      }
      destroyed = true
      this.state = { ok: true, ext: null, data: {} }
      this.elOutput.appendChild(h(JSON.stringify(this.state)))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn("[compute]", msg)
      if (!destroyed) {
        if (this.state.ok && this.state.ext) {
          this.state.ext.destroy?.(this.state.data)
        }
        if (this.state.ok && this.state.ext?.svg) {
          this.sheet.paper.queue()
        }
      }
      this.state = { ok: false, reason: msg }
    }
  }

  clearEls() {
    while (this.elOutput.firstChild) {
      this.elOutput.firstChild.remove()
    }
    while (this.elAside.firstChild) {
      this.elAside.firstChild.remove()
    }
  }

  setError(reason: string) {
    this.clearEls()
    this.elError.classList.remove("hidden")
    this.elError.textContent = reason
  }

  glsl: GlslResult | undefined
  display() {
    if (this.glsl) {
      this.glsl = undefined
      this.sheet.queueGlsl()
    }

    if (!this.state.ok) {
      this.setError(this.state.reason)
      return
    }

    if (this.state.ext == null) {
      this.clearEls()
      this.elError.classList.add("hidden")
      return
    }

    try {
      this.elError.classList.add("hidden")

      // .aside()
      {
        const aside = this.state.ext.aside?.(this.state.data)
        if (aside != this.elAside.firstChild) {
          while (this.elAside.firstChild) {
            this.elAside.firstChild.remove()
          }
          if (aside) {
            this.elAside.appendChild(aside)
          }
        }
      }

      // .el()
      {
        const el = this.state.ext.el?.(this.state.data)
        if (el != this.elOutput.firstChild) {
          while (this.elOutput.firstChild) {
            this.elOutput.firstChild.remove()
          }
          if (el) {
            this.elOutput.appendChild(el)
          }
        }
      }

      // .plotGl()
      {
        const gl = this.state.ext.plotGl?.(
          this.state.data,
          this.sheet.scope.helpers,
        )
        if (gl) {
          this.glsl = gl
          this.sheet.queueGlsl()
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn("[display]", msg)
      this.state = { ok: false, reason: msg }
      this.setError(msg)
    }
  }

  delete() {
    this.ref.delete()
  }

  unlink() {
    if (this.state.ok) {
      try {
        this.state.ext?.destroy?.(this.state.data)
      } catch (e) {
        console.warn("[expr.destroy]", e)
      }
    }

    this.field.unlink()
  }

  focus() {
    this.ref.focusAside()
  }
}
