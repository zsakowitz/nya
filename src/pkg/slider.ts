import { twMerge } from "tailwind-merge"
import type { Package } from "."
import type { AstBinding, Node, PlainVar } from "../eval/ast/token"
import { js } from "../eval/js"
import { parseNumberJs } from "../eval/lib/base"
import type { SReal } from "../eval/ty"
import { coerceValJs } from "../eval/ty/coerce"
import { frac, num, real } from "../eval/ty/create"
import { Display } from "../eval/ty/display"
import { TY_INFO } from "../eval/ty/info"
import { mul, neg, raise } from "../eval/ty/ops"
import { OpEq, OpLt } from "../field/cmd/leaf/cmp"
import { CmdVar } from "../field/cmd/leaf/var"
import { CmdSupSub } from "../field/cmd/math/supsub"
import { FieldInert } from "../field/field-inert"
import { Block, L, R, Selection } from "../field/model"
import { h } from "../jsx"
import { FieldComputed } from "../sheet/deps"
import { defineExt, Store } from "../sheet/ext"
import { Slider as RawSlider } from "../sheet/slider"
import type { Expr } from "../sheet/ui/expr"
import { PKG_REAL } from "./num/real"

function readSigned(node: Node, base: SReal): SReal | null {
  let isNeg = false
  if (node.type == "op" && !node.b && node.kind == "-") {
    isNeg = true
    node = node.a
  }

  if (node.type == "num" && !node.sub) {
    const { value } = parseNumberJs(node.value, base)
    return isNeg ? neg(value) : value
  }

  return null
}

function readExp(
  node: Node,
  base: SReal | null,
): { value: SReal; base: SReal | null } | null {
  let isNeg = false
  if (node.type == "op" && !node.b && node.kind == "-") {
    isNeg = true
    node = node.a
  }

  if (!base && node.type == "num" && node.sub) {
    const base = readSigned(node.sub, real(10))
    if (base == null) return null
    const value = readSigned(
      { type: "num", value: node.value, span: null },
      base,
    )
    if (value == null) return null
    return { value: isNeg ? neg(value) : value, base }
  }

  const baseRaw = base
  base ||= real(10)

  let value
  if (
    node.type == "op" &&
    (node.kind == "\\cdot " || node.kind == "\\times ") &&
    node.b.type == "suffixed" &&
    node.b.base.type == "num" &&
    node.b.suffixes.length == 1 &&
    node.b.suffixes[0]!.type == "raise" &&
    node.b.base.value == "10"
  ) {
    const a = readSigned(node.a, base)
    if (a == null) return null
    const b = readSigned(node.b.suffixes[0]!.exp, base)
    if (b == null) return null
    value = mul(a, raise(base, b))
  } else {
    value = readSigned(node, base)
  }
  if (value == null) return null

  return { value: isNeg ? neg(value) : value, base: baseRaw }
}

function readSlider(node: Node): { value: SReal; base: SReal | null } | null {
  if (
    node.type == "op" &&
    node.kind == "base" &&
    node.b.type == "num" &&
    !node.b.sub &&
    node.b.value.indexOf(".") == -1
  ) {
    const base = +node.b.value
    if (!(2 <= base && base <= 36)) return null
    const value = readExp(node.a, real(base))
    if (value == null) return null
    return { value: value.value, base: real(base) }
  } else {
    const value = readExp(node, null)
    if (value == null) return null
    return value
  }
}

const RED = [
  "border-b-2",
  "-mb-px",
  "focus:!border-b-[--nya-range-error]",
  "!border-b-[--nya-range-error]",
  "[.nya-range-error_&]:border-b-2",
]

class RangeControls {
  readonly min
  readonly max
  readonly step
  readonly scrubber
  readonly name

  readonly el

  constructor(
    readonly expr: Expr,
    name: PlainVar,
  ) {
    this.min = new Field(this, "order-1")
    this.max = new Field(this, "order-3")
    this.step = new Field(this)
    for (const field of [this.min, this.max, this.step]) {
      field.el.addEventListener("focus", () => {
        field.onBeforeChange()
        field.sel = new Selection(field.block, null, null, L)
        field.onAfterChange(false)
      })
    }
    this.name = new FieldInert(
      expr.sheet.options,
      expr.sheet.scope.ctx,
      "text-[1em]",
    )

    this.scrubber = new Slider(
      expr,
      name,
      "nya-range-scrubber px-1 pb-2 pt-2 -mt-2 cursor-pointer order-2",
    )

    this.el = h(
      "nya-range",
      this.min.el,
      h(
        "contents nya-range-bounds",
        " ",
        new OpLt(false, true).el,
        this.name.el,
        new OpLt(false, true).el,
        " ",
      ),
      this.max.el,
      h(
        "contents nya-range-bounds",
        h("ml-4 font-sans text-sm text-[--nya-range-step]", "Step: "),
        this.step.el,
      ),
      this.scrubber.el,
    )

    this.min.latex`-10`
    this.max.latex`10`
    this.min.ast = this.min.block.ast()
    this.max.ast = this.max.block.ast()
  }

  unlink() {
    this.min.unlink()
    this.max.unlink()
    this.step.unlink()
  }

  relink() {
    this.min.relink()
    this.max.relink()
    this.step.relink()
  }

  setBoundsAppropriately() {
    if (this.min.dirtyValue) {
      this.min.recomputeRaw()
    }
    if (this.max.dirtyValue) {
      this.max.recomputeRaw()
    }
    if (this.step.dirtyValue) {
      this.step.recomputeRaw()
    }

    if (
      this.min.value &&
      this.max.value &&
      typeof this.min.value != "string" &&
      typeof this.max.value != "string"
    ) {
      const nmin = num(this.min.value)
      const nmax = num(this.max.value)

      if (nmin <= nmax) {
        this.scrubber.bounds(this.min.value, this.max.value)
      } else {
        this.min.setError("Bounds must be in order.")
      }
    }

    if (this.step.value == null) {
      this.scrubber.step = frac(0, 1)
    } else if (typeof this.step.value != "string") {
      this.scrubber.step = this.step.value
    }
  }
}

class Field extends FieldComputed {
  value: SReal | string | null = null

  constructor(
    readonly controls: RangeControls,
    readonly className?: string,
  ) {
    super(
      controls.expr.sheet.scope,
      twMerge("nya-range-bound", className),
      true,
    )
    this.leaf = true
  }

  setError(e: unknown) {
    console.warn("[range bound eval]", e)
    this.el.classList.add(...RED)
    this.controls.el.classList.add("nya-range-error")
    this.value = e instanceof Error ? e.message : String(e)
  }

  recomputeRaw(): void {
    this.el.classList.remove(...RED)
    this.controls.el.classList.remove("nya-range-error")

    if (this.ast.type == "void") {
      this.value = null
      return
    }

    try {
      const value = js(this.ast, this.scope.propsJs)
      if (value.list !== false) {
        throw new Error(
          "A list of numbers cannot be a range bound. Try using any number.",
        )
      }
      try {
        var r32 = coerceValJs(value, "r32")
      } catch (e) {
        throw new Error(
          `Cannot use a ${TY_INFO[value.type].name} as a slider bound. Try using any number.`,
        )
      }
      const native = num(r32.value)
      if (native !== native) {
        throw new Error("Slider bounds may not be undefined.")
      }
      if (!isFinite(native)) {
        throw new Error("Slider bounds may not be infinite.")
      }
      this.value = r32.value
    } catch (e) {
      this.setError(e)
    }

    this.dirtyValue = false
  }

  recompute(): void {
    this.recomputeRaw()
    this.controls.setBoundsAppropriately()
  }
}

class Slider extends RawSlider {
  constructor(
    readonly expr: Expr,
    public name: PlainVar,
    className?: string,
  ) {
    super(className)
  }

  writtenBase = false

  onInput(): void {
    const { field } = this.expr
    this.expr.field.onBeforeChange()
    field.block.clear()
    const cursor = field.block.cursor(R)
    CmdVar.leftOf(cursor, this.name, field.options, field.ctx)
    new OpEq(false).insertAt(cursor, L)
    const base = this.base
    this.display(cursor, base)
    if (this.writtenBase || num(base) != 10) {
      const sub = new Block(null)
      new CmdSupSub(sub, null).insertAt(cursor, L)
      new Display(sub.cursor(R), frac(10, 1)).value(num(base))
    }
    this.expr.field.sel = cursor.selection()
    this.expr.field.onAfterChange(false)
  }
}

const store = new Store((expr) => {
  return new RangeControls(expr, (expr.field.ast as AstBinding).name)
})

const EXT_SLIDER = defineExt({
  data(expr) {
    let ast = expr.field.ast
    if (ast.type != "binding") return
    const value = readSlider(ast.value)
    if (!value) return
    const controls = store.get(expr)
    controls.scrubber.base = value.base || frac(10, 1)
    controls.scrubber.value = value.value
    controls.scrubber.name = ast.name
    controls.scrubber.writtenBase = !!value.base
    controls.name.block.clear()
    CmdVar.leftOf(
      controls.name.block.cursor(R),
      ast.name,
      expr.field.options,
      expr.field.ctx,
    )
    controls.relink()
    controls.setBoundsAppropriately()
    return controls
  },
  destroy(data) {
    data.unlink()
  },
  el(data) {
    return data.el
  },
})

export const PKG_SLIDER: Package = {
  id: "nya:slider",
  name: "sliders",
  label: "sliders on numeric variables",
  deps: [() => PKG_REAL],
  sheet: {
    exts: {
      0: [EXT_SLIDER],
    },
  },
}
