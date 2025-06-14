import type { PlainVar } from "@/eval/ast/token"
import { js } from "@/eval/ast/tx"
import { id } from "@/eval/lib/binding"
import type { GlslResult } from "@/eval/lib/fn"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "@/eval/ops/vars"
import type { JsValue } from "@/eval/ty"
import { outputBase } from "@/eval/ty/display"
import { OpEq } from "@/field/cmd/leaf/cmp"
import { CmdToken } from "@/field/cmd/leaf/token"
import { CmdVar } from "@/field/cmd/leaf/var"
import { CmdBrack } from "@/field/cmd/math/brack"
import { L, R } from "@/field/dir"
import { Block, Span } from "@/field/model"
import { fa, h } from "@/jsx"
import type { SReal } from "@/lib/real"
import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning"
import type { AnyExt } from "../../ext"
import { FACTORY_EXPR } from "../../factory-expr"
import type { ItemRef } from "../../items"
import { PICK_CURSOR } from "../../pick-cursor"
import type { Sheet } from "../sheet"
import { Field } from "./field"

import { STORE_EVAL } from "#/list/eval"
import "@/eval2/txs"
import { PosVirtual } from "../../../../lang/src/ast/issue"
import { tryPerformCall } from "../../../../lang/src/emit/emit"
import { ident } from "../../../../lang/src/emit/id"
import { Entry } from "../../../../lang/src/exec/item"

const ID_X = id({ value: "x" })
const ID_Y = id({ value: "y" })
const ID_P = id({ value: "p" })

export type ExprStateOk =
  | { ok: true; ext: AnyExt | null; data: {} }
  | { ok: true; ext: null; data?: undefined }

type ExprState = { ok: false; reason: string; ext?: undefined } | ExprStateOk

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
  readonly entry

  state: ExprState = { ok: false, reason: "Not computed yet." }

  constructor(
    readonly sheet: Sheet,
    readonly ref: ItemRef<Expr>,
  ) {
    this.entry = new Entry(sheet.set)
    this.field = new Field(
      this,
      "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] max-w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] p-4 focus:outline-none",
    )
    this.elOutput = h("contents")
    this.elError = h(
      "block mx-1 -mt-2 px-1 pb-1 leading-tight italic text-[--nya-expr-error] whitespace-pre-wrap font-sans pointer-events-none",
    )
    this.elError.classList.add("hidden") // stops tailwind errors from block+hidden; hidden overrides
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
        if (this.state.ok && this.state.ext?.plot) {
          this.sheet.cv.queue()
        }
      }
      this.state = { ok: false, reason: this.field.error }
      return
    }

    if (this.field.ast.type == "binding" && this.field.ast.params) {
      this.state = { ok: true, ext: null }
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
          if (this.state.ok && this.state.ext?.plot) {
            this.sheet.cv.queue()
          }
          destroyed = true
          this.state = { ok: true, ext: ext as any, data: data as any }
          if (ext.plot) {
            this.sheet.cv.queue()
          }
          return
        }
      }

      if (this.state.ok && this.state.ext) {
        this.state.ext.destroy?.(this.state.data)
      }
      if (this.state.ok && this.state.ext?.plot) {
        this.sheet.cv.queue()
      }
      destroyed = true
      this.state = { ok: true, ext: null }
      this.elOutput.appendChild(h(JSON.stringify(this.state)))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn("[compute]", msg)
      if (!destroyed) {
        if (this.state.ok && this.state.ext) {
          this.state.ext.destroy?.(this.state.data)
        }
        if (this.state.ok && this.state.ext?.plot) {
          this.sheet.cv.queue()
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
    this.elOutput.classList.add("hidden")
    this.elError.classList.add("hidden")

    // If errored:
    if (this.entry.hasError()) {
      this.elError.classList.remove("hidden")
      this.elError.textContent = this.entry.errorMessage
      return
    }

    this.entry.checkExe()
    const exe = this.entry.exe

    // If a function or empty:
    if (!exe || exe.args) {
      return
    }

    try {
      const env = this.sheet.factory.env
      const { block, value } = env.compile(exe.expr, "<expression>")
      const display = tryPerformCall(
        ident("%display"),
        block,
        [value],
        new PosVirtual("<display>"),
        new PosVirtual("<display>"),
      )
      let latex
      this.clearEls()
      if (
        display &&
        display.type == env.libJs.tyLatex &&
        typeof (latex = env.compute(block, display)) == "string"
      ) {
        const { field, el } = STORE_EVAL.get(this)
        field.block.clear()
        field.typeLatex("=" + latex.replace(/\+-/g, "-"))
        this.elOutput.appendChild(el)
      } else {
        const json = JSON.stringify(env.compute(block, value), undefined, 2)
        this.elOutput.appendChild(
          h(
            "-mt-2 mb-1 text-xs font-mono px-2 ml-auto whitespace-pre",
            `= ${value.type} ${json.replace(/\n/g, "\n  ")}`,
          ),
        )
      }
      this.elOutput.classList.remove("hidden")
    } catch (e) {
      this.elOutput.classList.add("hidden")
      this.elError.classList.remove("hidden")
      this.elError.textContent = e instanceof Error ? e.message : String(e)
    }

    // TODO: display result as glsl
    // TODO: plot result via %plot
    // TODO: use extensions (aside, output, plot, glsl)
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

  /**
   * Gets this expression's binding identifier. If no binding identifier exists,
   * a token is created, inserted properly, and returned.
   */
  name(): PlainVar {
    if (this.field.ast.type == "binding") {
      return this.field.ast.name
    }

    const token = CmdToken.new(this.field.scope)
    const cursor = this.field.block.cursor(L)
    token.insertAt(cursor, L)
    new OpEq(false).insertAt(cursor, L)
    const name: PlainVar = {
      type: "var",
      kind: "var",
      span: new Span(this.field.block, token[L], token[R]),
      value: "$" + token.id,
    }
    this.field.ast = {
      type: "binding",
      name,
      params: null,
      value: this.field.ast,
    }
    this.field.queueAstUpdate()

    return {
      type: "var",
      kind: "var",
      span: new Span(this.field.block, token[L], token[R]),
      value: "$" + token.id,
    }
  }

  /**
   * Creates a reference to the item with the given index. If this item's value
   * is not a list, no index is appended.
   */
  createRef(index: number): Block {
    const block = new Block(null)
    const cursor = block.cursor(R)
    CmdVar.leftOf(cursor, this.name(), this.field.options, this.field.scope)
    if (this.js?.value.list !== false) {
      CmdBrack.index(index + 1).insertAt(cursor, L)
    }

    return block
  }
}
