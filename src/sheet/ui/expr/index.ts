import type { PlainVar } from "@/eval/ast/token"
import { type GlslResult } from "@/eval/lib/fn"
import type { JsValue } from "@/eval/ty"
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

import { IdMap } from "!/emit/decl"
import { ident } from "!/emit/id"
import type { Type } from "!/emit/type"
import { Value } from "!/emit/value"
import { Entry } from "!/exec/item"
import type { Executable } from "!/exec/state"
import type { CanvasJs } from "!/std"
import { STORE_EVAL } from "#/list/eval"
import { errorText } from "@/error"
import "@/eval2/txs"
import { Color, Size } from "../cv/consts"

type RenderingContext2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D

type ExprStateOk =
  | { ok: true; ext: AnyExt | null; data: {} }
  | { ok: true; ext: null; data?: undefined }

type ExprState = { ok: false; reason: string; ext?: undefined } | ExprStateOk

export class Expr {
  static of(sheet: Sheet, geo?: boolean) {
    return sheet.list.create(FACTORY_EXPR, { from: { geo } }).data
  }

  readonly field
  readonly elOutput
  readonly elAside
  readonly elError
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
      "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] max-w-[calc(var(--nya-sidebar)-2.5rem-1px)] p-4 focus:outline-hidden",
    )
    this.elOutput = h("contents")
    this.elError = h(
      "block mx-1 -mt-2 px-1 pb-1 leading-tight italic text-(--nya-expr-error) whitespace-pre-wrap font-sans pointer-events-none" +
        (new URL(location.href).searchParams.has("errorless") ?
          " hidden!"
        : ""),
    )
    this.elError.classList.add("hidden") // stops tailwind errors from block+hidden; hidden overrides
    this.aside = h(
      "contents",
      fa(
        faWarning,
        "hidden mb-1.5 mx-auto size-6 fill-(--nya-icon-error) in-[.nya-expr-error]:block",
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

  drawSelf() {
    if (!this.plot) {
      return
    }

    const { ctx, scale } = this.sheet.cv

    ctx.resetTransform()
    ctx.scale(scale, scale)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    try {
      this.plot(ctx, this.sheet.cv.nya())
    } finally {
      ctx.resetTransform()
    }
  }

  plot: ((ctx: RenderingContext2D, canvas: CanvasJs) => void) | undefined
  glsl: GlslResult | undefined

  display() {
    this.elOutput.classList.add("hidden")
    this.elError.classList.add("hidden")

    // If errored:
    if (this.entry.hasError()) {
      this.elError.classList.remove("hidden")
      this.elError.textContent = this.entry.errorMessage
      if (this.glsl) {
        this.glsl = undefined
        this.sheet.queueGlsl()
      }
      if (this.plot) {
        this.plot = undefined
        this.sheet.cv.queue()
      }
      return
    }

    if (this.glsl) {
      this.glsl = undefined
      this.sheet.queueGlsl()
    }
    if (this.plot) {
      this.plot = undefined
      this.sheet.cv.queue()
    }

    try {
      this.entry.checkExe()

      const exe = this.entry.exe
      if (!exe || exe.args) return

      if (exe.expr.includes("\/\/NYALANG_SHADER\n")) {
        compileForGlsl(this, exe)
      } else {
        compileForJs(this, exe)
      }
    } catch (e) {
      this.elOutput.classList.add("hidden")
      this.elError.classList.remove("hidden")
      this.elError.textContent = errorText(e)
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
    this.entry.remove()
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

function compileForGlsl(self: Expr, exe: Executable) {
  const env = self.sheet.factory.env

  const { block, value } = env.process(
    `{let x: Color = %plot_shader(${exe.expr});x}`,
    "<expression>",
    new IdMap<Value>(null)
      .set(ident("x"), new Value("vl_coords.x", env.libGl.tyNum, false))
      .set(ident("y"), new Value("vl_coords.y", env.libGl.tyNum, false)),
    env.libGl,
  )

  const result = value.toString()
  self.glsl = { block: block.source, value: result }
  self.sheet.queueGlsl()
}

function printJs(self: Expr, latex: string | null, value: unknown, type: Type) {
  self.clearEls()

  if (latex) {
    const { field, el } = STORE_EVAL.get(self)
    field.block.clear()
    field.typeLatex(latex.replace(/\+-/g, "-"))
    self.elOutput.appendChild(el)
  } else if (!self.plot) {
    const json = JSON.stringify(value, undefined, 2)
    self.elOutput.appendChild(
      h(
        "-mt-2 mb-1 text-xs font-mono px-2 ml-auto whitespace-pre",
        `= ${type} ${json.replace(/\n/g, "\n  ")}`,
      ),
    )
  }

  self.elOutput.classList.remove("hidden")
}

function plotJs(self: Expr, value: unknown, type: Type) {
  let changed = !!self.plot
  self.plot = undefined

  const utils = self.sheet.factory.env.utils
  const plot2d = utils.get("plot-2d", type)

  if (plot2d) {
    changed = true

    switch (plot2d.output) {
      case "pt":
        self.plot = (ctx, cv) => {
          const { x, y } = plot2d.exec(cv, value)
          ctx.beginPath()
          ctx.ellipse(x, y, Size.Point, Size.Point, 0, 0, 2 * Math.PI)
          ctx.fillStyle = Color.Purple
          ctx.globalAlpha = 1
          ctx.fill()
        }
        break

      case "path1":
        self.plot = (ctx, cv) => {
          const path = plot2d.exec(cv, value)
          ctx.strokeStyle = Color.Blue
          ctx.lineWidth = Size.Line
          ctx.globalAlpha = 1
          ctx.stroke(path)
        }
        break

      case "path1*":
        self.plot = (ctx, cv) => {
          const path = plot2d.exec(cv, value)
          ctx.strokeStyle =
            ctx.fillStyle = `rgb(${255 * path.y[0]},${255 * path.y[1]},${255 * path.y[2]})`
          ctx.lineWidth = path.a
          ctx.globalAlpha = path.w
          ctx.fill(path.x)
          ctx.globalAlpha = path.z
          ctx.stroke(path.x)
        }
        break
    }
  }

  if (changed) {
    self.sheet.cv.queue()
  }
}

function compileForJs(self: Expr, exe: Executable) {
  const env = self.sheet.factory.env
  const { block, value } = env.process(exe.expr, "<expression>")
  const result = env.compute(block, value)

  plotJs(self, result, value.type)
  printJs(self, env.display(value.type, result), result, value.type)
}
