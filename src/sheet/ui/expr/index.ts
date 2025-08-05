import { IdMap } from "!/emit/decl"
import { ident } from "!/emit/id"
import type { Type } from "!/emit/type"
import { Value } from "!/emit/value"
import { Entry } from "!/exec/item"
import type { CanvasJs } from "!/std/2d"
import { ScriptDeps } from "@/eval/tx"
import "@/eval/txs"
import { each } from "@/eval/util"
import { FieldInert } from "@/field/field-inert"
import { bug, errorText, todo } from "@/lib/error"
import { fa, h } from "@/lib/jsx"
import { PLOT_3D } from "@/sheet/plot/3d"
import type { Shader } from "@/sheet/plot/shader"
import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning"
import {
  Material,
  Mesh,
  ShaderMaterial,
  type BufferGeometry,
  type Vector3,
} from "three"
import { ParametricGeometry } from "three/examples/jsm/Addons.js"
import { Store, type AnyExt } from "../../ext"
import { FACTORY_EXPR } from "../../factory-expr"
import type { ItemRef } from "../../items"
import { Color, Size } from "../cv/consts"
import type { Sheet } from "../sheet"
import { Field } from "./field"

const STORE_EVAL = new Store((e) => {
  const field = new FieldInert(
    e.field.options,
    e.sheet.scope,
    "bg-(--nya-bg-sidebar) border border-(--nya-border) px-2 pt-[.35rem] pb-[.25rem] rounded-sm inline-block",
  )
  const el = h(
    "flex px-2 pb-2 -mt-2 w-[calc(var(--nya-sidebar)-2.5rem-1px)] overflow-x-auto [&::-webkit-scrollbar]:hidden items-baseline",
    h(
      "ml-auto inline-block relative top-[-.1rem] text-[1.1rem] pr-1.5 text-slate-400",
      "=",
    ),
    field.el,
  )
  return { field, el }
})

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
  lastObjs: { removeFromParent(): void }[] | undefined
  lastMat: ShaderMaterial | undefined

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
    })
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

  drawSelf() {
    if (PLOT_3D) return

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
  glsl: Shader | undefined

  unrender2D() {
    if (this.glsl) {
      this.glsl = undefined
      this.sheet.queueGlsl()
    }
    if (this.plot) {
      this.plot = undefined
      this.sheet.cv.queue()
    }
  }

  unrender3D() {
    if (this.lastObjs) {
      this.lastObjs.forEach((x) => {
        x.removeFromParent()
        if (x instanceof Mesh) {
          ;(x.geometry as BufferGeometry).dispose()
        }
      })
      this.lastObjs = undefined
      this.sheet.cv3D!.queue()
    }
    if (this.lastMat) {
      this.lastMat.dispose()
      this.lastMat = undefined
    }
  }

  display() {
    this.unrender2D()
    this.unrender3D()

    this.elOutput.classList.add("hidden")

    // If errored:
    if (this.entry.hasError()) {
      this.elError.classList.remove("hidden")
      this.elError.textContent = this.entry.errorMessage
      return
    }

    this.elError.classList.add("hidden")

    try {
      this.entry.checkExe()

      const exe = this.entry.exe
      if (!exe || exe.args) return

      const expr = exe.expr
      if (expr.includes("//NYALANG_SHADER\n")) {
        if (PLOT_3D) {
          todo(`The 'shader' keyword is only available in 2D mode for now.`)
        }

        compileForGlsl(this, expr)
      } else if (expr.startsWith("{//NYALANG_SHADED")) {
        if (!PLOT_3D) {
          todo(
            `The 'shaded' keyword is only available in 3D mode. Maybe you meant 'shader'?`,
          )
        }

        const shader = extractShaded(expr)
        if (shader == null) {
          bug(`Nonexistent shader found.`)
        }
        compileJs(this, removeShaded(expr), shader)
      } else {
        compileJs(this, removeShaded(expr), null)
      }
    } catch (e) {
      this.elOutput.classList.add("hidden")
      this.elError.classList.remove("hidden")
      this.elError.textContent = errorText(e)
    }

    // TODO: use extensions (aside, output)
  }

  delete() {
    this.ref.delete()
  }

  unlink() {
    this.unrender2D()
    this.unrender3D()

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
}

function extractShaded(expr: string) {
  const marker = "//NYALANG_SHADED("
  const idx = expr.indexOf(marker)
  if (idx == -1) return null
  const num = expr.slice(idx + marker.length).match(/^\d+/)![0]
  const end = `;//NYALANG_SHADED_END(${num})`
  const endIdx = expr.indexOf(end, idx + marker.length)
  if (endIdx == -1) return null
  return removeShaded(expr.slice(idx + marker.length + num.length + 1, endIdx))
}

function removeShaded(expr: string) {
  const marker = "//NYALANG_SHADED("
  let idx
  while ((idx = expr.indexOf(marker)) != -1) {
    const num = expr.slice(idx + marker.length).match(/^\d+/)![0]
    const end = `;//NYALANG_SHADED_END(${num})`
    const endIdx = expr.indexOf(end, idx + marker.length)
    if (endIdx == -1) break
    expr = expr.slice(0, idx) + expr.slice(endIdx + end.length)
  }
  return expr
}

function compileForGlsl(self: Expr, expr: string) {
  const env = self.sheet.factory.env

  const { block, value } = env.process(
    `{let x = %plot_shader(${expr}) -> Color;x}`,
    "<expression>",
    new IdMap<Value>(null)
      .set(ident("x"), new Value("vl_coords.x", env.libGl.tyNum, false))
      .set(ident("y"), new Value("vl_coords.y", env.libGl.tyNum, false)),
    env.libGl,
  )

  const result = value.toString()
  self.glsl = {
    globals: block.globals.get(),
    block: block.source,
    value: result,
  }
  self.sheet.queueGlsl()
}

function printJs(self: Expr, latex: string | null) {
  self.clearEls()

  if (latex) {
    const { field, el } = STORE_EVAL.get(self)
    field.block.clear()
    field.typeLatex(latex.replace(/\+-/g, "-"))
    self.elOutput.appendChild(el)
    self.elOutput.classList.remove("hidden")
  }
}

function plotJs3D(
  self: Expr,
  value: unknown,
  type: Type,
  shader: string | null,
) {
  let changed = false

  if (self.lastObjs) {
    self.unrender3D()
    changed = true
  }

  const plot3d = self.sheet.factory.env.utils.getArray("plot-3d", type)

  if (plot3d) {
    changed = true
    let shade: ((mat: Material) => void) | undefined
    if (shader) {
      const env = self.sheet.factory.env
      shade = self.sheet.cv3D!.createShaderFromText(env, shader)
      self.sheet.cv3D!.shade = shade
    } else {
      self.sheet.cv3D!.shade = undefined
    }
    self.lastObjs = []
    each(type, value, (value) => {
      const raw = plot3d.exec(self.sheet.cv3D!, value)
      self.sheet.cv3D!.scene.add(raw)
      self.lastObjs!.push(raw)
    })
  }

  if (changed) {
    self.sheet.cv3D!.queue()
  }
}

function plotJs2D(self: Expr, value: unknown, type: Type) {
  let changed = !!self.plot
  self.plot = undefined

  const utils = self.sheet.factory.env.utils
  const plot2d = utils.getArray("plot-2d", type)

  if (plot2d) {
    changed = true

    switch (plot2d.output) {
      case "pt":
        self.plot = (ctx, cv) => {
          ctx.beginPath()
          ctx.fillStyle = Color.Purple
          ctx.globalAlpha = 1
          each(type, value, (value) => {
            const { x, y } = plot2d.exec(cv, value)
            ctx.ellipse(x, y, Size.Point, Size.Point, 0, 0, 2 * Math.PI)
          })
          ctx.fill()
        }
        break

      case "path1":
        self.plot = (ctx, cv) => {
          ctx.strokeStyle = Color.Blue
          ctx.lineWidth = Size.Line
          ctx.globalAlpha = 1
          each(type, value, (value) => {
            const path = plot2d.exec(cv, value)
            ctx.stroke(path)
          })
        }
        break

      case "path1*":
        self.plot = (ctx, cv) => {
          each(type, value, (value) => {
            const path = plot2d.exec(cv, value)
            ctx.strokeStyle =
              ctx.fillStyle = `rgb(${255 * path.y[0]},${255 * path.y[1]},${255 * path.y[2]})`
            ctx.lineWidth = path.a
            ctx.globalAlpha = path.w
            ctx.fill(path.x)
            ctx.globalAlpha = path.z
            ctx.stroke(path.x)
          })
        }
        break
    }
  }

  if (changed) {
    self.sheet.cv.queue()
  }
}

function compileJs(self: Expr, expr: string, shader: string | null) {
  const deps = new ScriptDeps()
  deps.check(self.field.block.parseTopLevel())

  if (PLOT_3D && (deps.has("x") || deps.has("y"))) {
    self.unrender3D()
    const env = self.sheet.factory.env
    const cv = self.sheet.cv3D!
    const { block, value } = env.process(
      expr,
      "<expression>",
      new IdMap<Value>(null)
        .set(ident("x"), new Value("pos_x", env.libJs.tyNum, false))
        .set(ident("y"), new Value("pos_y", env.libJs.tyNum, false)),
    )
    if (value.type != env.libJs.tyNum) {
      todo("I don't know how to plot this.")
    }
    const f = env.compile(block, value, "pos_x,pos_y")
    cv.setShader(env, shader)
    function func(u: number, v: number, target: Vector3) {
      const { xmin, xmax, ymin, ymax } = cv.bounds()
      const x = (xmax - xmin) * u + xmin
      const y = (ymax - ymin) * v + ymin
      const z = f(x, y) as number
      target.set(x, y, z)
    }
    let geo = new ParametricGeometry(func, 64, 64)
    const mesh = new Mesh(geo, cv.makeMat())
    self.lastObjs = [mesh]
    mesh.onAfterRender = () => {
      const prev = geo
      const next = cv.regenParametric(prev)
      mesh.geometry = next
      geo = next
      setTimeout(() => prev.dispose())
    }
    cv.scene.add(mesh)
    cv.queue()
    return
  }

  const env = self.sheet.factory.env
  const { block, value } = env.process(expr, "<expression>")
  const result = env.compute(block, value)

  printJs(self, env.display(value.type, result))

  if (PLOT_3D) {
    plotJs3D(self, result, value.type, shader)
  } else {
    plotJs2D(self, result, value.type)
  }
}
