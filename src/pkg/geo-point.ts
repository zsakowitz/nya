import type { Package } from "."
import { dragPoint } from "../eval/ast/tx"
import { FnDist } from "../eval/ops/dist"
import { declareDebugPoint, FN_DEBUGPOINT } from "../eval/ops/fn/debugpoint"
import { FN_UNSIGN } from "../eval/ops/fn/unsign"
import { FN_VALID } from "../eval/ops/fn/valid"
import { abs, abs64, OP_ABS } from "../eval/ops/op/abs"
import { add, addR64, OP_ADD } from "../eval/ops/op/add"
import { declareMulR64, mul } from "../eval/ops/op/mul"
import { neg, OP_NEG } from "../eval/ops/op/neg"
import { declareOdotC64, OP_ODOT } from "../eval/ops/op/odot"
import { OP_POINT } from "../eval/ops/op/point"
import { OP_POS } from "../eval/ops/op/pos"
import { OP_X } from "../eval/ops/op/x"
import { OP_Y } from "../eval/ops/op/y"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../eval/ops/vars"
import { each, type JsValue } from "../eval/ty"
import { approx, frac, num, pt, real, unpt } from "../eval/ty/create"
import { highRes, TY_INFO, WRITE_POINT } from "../eval/ty/info"
import { OpEq } from "../field/cmd/leaf/cmp"
import { CmdDot } from "../field/cmd/leaf/dot"
import { CmdVar } from "../field/cmd/leaf/var"
import { Block, L, R } from "../field/model"
import { h } from "../jsx"
import { Prop, Store } from "../sheet/ext"
import { defineHideable } from "../sheet/ext/hideable"
import { Transition } from "../sheet/transition"
import type { Paper, Point } from "../sheet/ui/paper"
import type { Sheet } from "../sheet/ui/sheet"
import { virtualStepExp, write, Writer } from "../sheet/write"
import { OP_PLOT, plotJs } from "./color-core"
import { EXT_EVAL } from "./eval"
import { createPickByTy, PICK_BY_TY, picker } from "./geo/pick-normal"
import { PKG_REAL } from "./num-real"

declare module "../eval/ty/index.js" {
  interface Tys {
    point32: SPoint
    point64: SPoint
  }

  interface TyComponents {
    point32: "r32"
    point64: "r64"
  }
}

const color = new Store(
  (expr) => new Transition(4, () => expr.sheet.paper.queue()),
)

const SELECTED = new Prop(() => false)
const DIMMED = new Prop(() => false)

export function drawPoint(
  paper: Paper,
  at: Point,
  size = 4,
  halo?: boolean,
  dimmed?: boolean,
) {
  const offset = paper.paperToCanvas(at)
  if (!(isFinite(offset.x) && isFinite(offset.y))) return
  const { ctx, scale } = paper

  if (dimmed) {
    ctx.globalAlpha = 0.3
  }

  if (halo) {
    ctx.beginPath()
    ctx.fillStyle = "#6042a659"
    ctx.arc(offset.x, offset.y, 12 * scale, 0, 2 * Math.PI)
    ctx.fill()
  }

  ctx.beginPath()
  ctx.fillStyle = "#6042a6"
  ctx.arc(offset.x, offset.y, size * scale, 0, 2 * Math.PI)
  ctx.fill()

  if (dimmed) {
    ctx.globalAlpha = 1
  }
}

export const EXT_POINT = defineHideable({
  data(expr) {
    const value = expr.js?.value

    let node = expr.field.ast
    if (node.type == "binding") node = node.value

    const drag = dragPoint(node, expr.sheet.scope.propsDrag(expr.field))

    if (
      value &&
      (value.type == "point32" ||
        value.type == "point64" ||
        value.type == "c32" ||
        value.type == "c64")
    ) {
      return {
        value: value as JsValue<"point32" | "point64" | "c32" | "c64">,
        paper: expr.sheet.paper,
        expr,
        drag,
      }
    }
  },
  el(data) {
    return EXT_EVAL.el!(EXT_EVAL.data(data.expr)!)
  },
  plot2d(data, paper) {
    for (const pt of each(data.value)) {
      drawPoint(
        paper,
        unpt(pt),
        SELECTED.get(data.expr) ? 6
        : data.drag ? color.get(data.expr).get()
        : 4,
        !!data.drag,
        DIMMED.get(data.expr),
      )
    }
  },
  layer() {
    return 3
  },
  drag: {
    start(data, at) {
      if (!data.drag || data.value.list !== false) {
        return
      }

      if (
        data.paper.canvasDistance(at, unpt(data.value.value)) <=
        12 * data.paper.scale
      ) {
        color.get(data.expr).set(12)

        return {
          expr: data.expr,
          paper: data.paper,
          name:
            data.expr.field.ast.type == "binding" ?
              data.expr.field.ast.name
            : null,
          drag: data.drag,
        }
      }
    },
    cursor(data) {
      if (data.drag.type == "split") {
        return (
          data.drag.x && !data.drag.y ? "ew-resize"
          : data.drag.y && !data.drag.x ? "ns-resize"
          : "move"
        )
      }

      return "move"
    },
    move(data, to) {
      const { drag } = data

      switch (drag.type) {
        case "split":
          if (drag.x) {
            new Writer(drag.x.span.remove().span()).set(
              to.x,
              data.paper.el.width / data.paper.bounds().w,
              drag.x.signed,
            )
            drag.x.field.sel = drag.x.field.block.cursor(R).selection()
            drag.x.field.queueAstUpdate()
          }

          if (drag.y) {
            new Writer(drag.y.span.remove().span()).set(
              to.y,
              data.paper.el.height / data.paper.bounds().h,
              drag.y.signed,
            )
            drag.y.field.sel = drag.y.field.block.cursor(R).selection()
            drag.y.field.queueAstUpdate()
          }

          break
        case "complex":
          {
            const x = to.x
            const xp = data.paper.el.width / data.paper.bounds().w
            const y = to.y
            const yp = data.paper.el.height / data.paper.bounds().h
            const cursor = drag.span.remove()
            write(cursor, real(x), frac(10, 1), virtualStepExp(xp, 10), false)
            write(cursor, real(y), frac(10, 1), virtualStepExp(yp, 10), true)
            new CmdVar("i", data.expr.field.options).insertAt(cursor, L)
            drag.field.sel = drag.field.block.cursor(R).selection()
            drag.field.queueAstUpdate()
          }
          break
        case "glider":
          {
            const { value, precision } = TY_INFO[drag.shape.type].glide!({
              paper: data.paper,
              point: to,
              shape: drag.shape.value as never,
            })
            new Writer(drag.value.span.remove().span()).set(value, precision)
            drag.value.field.sel = drag.value.field.block.cursor(R).selection()
            drag.value.field.queueAstUpdate()
          }
          break
      }
    },
    end(data) {
      color.get(data.expr).set(4)
      data.expr.focus()
    },
  },
  hover: {
    on(data, at) {
      if (!data.drag || data.value.list !== false) {
        return
      }

      if (
        data.paper.canvasDistance(at, unpt(data.value.value)) <=
        12 * data.paper.scale
      ) {
        color.get(data.expr).set(12)
        return data
      }
    },
    cursor(data) {
      const drag = data.drag!

      if (drag.type == "split") {
        return (
          drag.x && !drag.y ? "ew-resize"
          : drag.y && !drag.x ? "ns-resize"
          : "move"
        )
      }

      return "move"
    },
    off(data) {
      color.get(data.expr).set(4)
    },
  },
  select: {
    ty(data) {
      const ty = data.value.type
      return (
        ty == "c32" ? "point32"
        : ty == "c64" ? "point64"
        : ty
      )
    },
    dim(data) {
      DIMMED.set(data.expr, true)
    },
    undim(data) {
      DIMMED.set(data.expr, false)
    },
    on(data, at) {
      if (data.value.list !== false) {
        return
      }

      if (
        data.paper.canvasDistance(at, unpt(data.value.value)) <=
        12 * data.paper.scale
      ) {
        SELECTED.set(data.expr, true)
        return { ...data, value: data.value }
      }
    },
    off(data) {
      SELECTED.set(data.expr, false)
    },
    val(data) {
      const ty = data.value.type
      return {
        ...data.value,
        type:
          ty == "c32" ? "point32"
          : ty == "c64" ? "point64"
          : ty,
      }
    },
    ref(data) {
      if (data.expr.field.ast.type == "binding") {
        const block = new Block(null)
        CmdVar.leftOf(
          block.cursor(R),
          data.expr.field.ast.name,
          data.expr.field.options,
        )
        return block
      }

      const name = data.expr.sheet.scope.name("p")
      const c = data.expr.field.block.cursor(L)
      CmdVar.leftOf(c, name, data.expr.field.options)
      new OpEq(false).insertAt(c, L)
      data.expr.field.dirtyAst = data.expr.field.dirtyValue = true
      data.expr.field.trackNameNow()
      data.expr.field.scope.queueUpdate()

      const block = new Block(null)
      const cursor = block.cursor(R)
      CmdVar.leftOf(cursor, name, data.expr.field.options)
      if (data.value.type.startsWith("c")) {
        new CmdDot().insertAt(cursor, L)
        for (const c of "point") {
          new CmdVar(c, data.expr.field.options).insertAt(cursor, L)
        }
      }

      return block
    },
  },
})

export const FN_GLIDER = new FnDist<"point32">(
  "glider",
  "constructs a point on an object",
)

export const FN_INTERSECTION = new FnDist<"point32">(
  "intersection",
  "constructs the point where two objects intersect",
)

const FN_SCREENDISTANCE = new FnDist<"r32">(
  "screendistance",
  "calculates the distance between two points in terms of pixels on your screen, rather than graphpaper units",
)

const PICK_POINT = createPickByTy("p", null, [["point32", "point64"]], () => {})

export const PKG_GEO_POINT: Package = {
  id: "nya:geo-point",
  name: "geometric points",
  label: "adds geometric points",
  deps: [() => PKG_REAL],
  init() {
    FN_SCREENDISTANCE.add(
      ["point32", "point32"],
      "r32",
      () => {
        throw new Error("Cannot calculate screendistance outside of shaders.")
      },
      (_, a, b) => {
        return `length((${a.expr} - ${b.expr}) * u_px_per_unit.xz)`
      },
    )

    OP_ADD.add(
      ["point64", "point64"],
      "point64",
      (a, b) => pt(add(a.value.x, b.value.x), add(a.value.y, b.value.y)),
      (ctx, ar, br) => {
        const a = ctx.cache(ar)
        const b = ctx.cache(br)
        return `vec4(${addR64(ctx, `${a}.xy`, `${b}.xy`)}, ${addR64(ctx, `${a}.zw`, `${b}.zw`)})`
      },
    ).add(
      ["point32", "point32"],
      "point32",
      (a, b) => pt(add(a.value.x, b.value.x), add(a.value.y, b.value.y)),
      (_, a, b) => `(${a.expr} + ${b.expr})`,
    )

    FN_UNSIGN.add(
      ["point64"],
      "point64",
      (a) => pt(abs(a.value.x), abs(a.value.y)),
      (ctx, a) => {
        const name = ctx.cache(a)
        return `vec4(${abs64(ctx, `${name}.xy`)}, ${abs64(ctx, `${name}.zw`)})`
      },
    ).add(
      ["point32"],
      "point32",
      (a) => pt(abs(a.value.x), abs(a.value.y)),
      (_, a) => `abs(${a.expr})`,
    )

    OP_X.add(
      ["point64"],
      "r64",
      (a) => a.value.x,
      (_, a) => `${a.expr}.xy`,
    ).add(
      ["point32"],
      "r32",
      (a) => a.value.x,
      (_, a) => `${a.expr}.x`,
    )

    OP_Y.add(
      ["point64"],
      "r64",
      (a) => a.value.y,
      (_, a) => `${a.expr}.zw`,
    ).add(
      ["point32"],
      "r32",
      (a) => a.value.y,
      (_, a) => `${a.expr}.y`,
    )

    OP_PLOT.add(
      ["point32"],
      "color",
      plotJs,
      (ctx, a) => FN_DEBUGPOINT.glsl1(ctx, a).expr,
    )

    OP_ABS.add(
      ["point32"],
      "r32",
      // TODO: this is exact for some values
      (a) => approx(Math.hypot(num(a.value.x), num(a.value.y))),
      (_, a) => `length(${a.expr})`,
    )

    OP_NEG.add(
      ["point64"],
      "point64",
      (a) => pt(neg(a.value.x), neg(a.value.y)),
      (_, a) => `(-${a.expr})`,
    ).add(
      ["point32"],
      "point32",
      (a) => pt(neg(a.value.x), neg(a.value.y)),
      (_, a) => `(-${a.expr})`,
    )

    FN_VALID.add(
      ["point32"],
      "bool",
      (a) => isFinite(num(a.value.x)) && isFinite(num(a.value.y)),
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `(!isnan(${a}.x) && !isinf(${a}.x) && !isnan(${a}.y) && !isinf(${a}.y))`
      },
    )

    OP_ODOT.add(
      ["point64", "point64"],
      "point64",
      (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
      (ctx, a, b) => {
        declareMulR64(ctx)
        declareOdotC64(ctx)
        return `_helper_odot_c64(${a.expr}, ${b.expr})`
      },
    ).add(
      ["point32", "point32"],
      "point32",
      (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
      (_, a, b) => {
        return `(${a.expr} * ${b.expr})`
      },
    )

    OP_POINT.add(
      ["r64", "r64"],
      "point64",
      (x, y) => pt(x.value, y.value),
      (_, x, y) => `vec4(${x.expr}, ${y.expr})`,
    ).add(
      ["r32", "r32"],
      "point32",
      (x, y) => pt(x.value, y.value),
      (_, x, y) => `vec2(${x.expr}, ${y.expr})`,
    )

    OP_POS.add(
      ["point64"],
      "point64",
      (a) => a.value,
      (_, a) => a.expr,
    ).add(
      ["point32"],
      "point32",
      (a) => a.value,
      (_, a) => a.expr,
    )

    FN_DEBUGPOINT.add(
      ["c32"],
      "color",
      () => {
        throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
      },
      (ctx, a) => declareDebugPoint(ctx, a),
    )
  },
  ty: {
    info: {
      point64: {
        name: "point",
        namePlural: "points",
        glsl: "vec4",
        garbage: { js: pt(real(NaN), real(NaN)), glsl: "vec4(0.0/0.0)" },
        coerce: {
          point32: {
            js(self) {
              return self
            },
            glsl(self) {
              return `${self}.xz`
            },
          },
        },
        write: WRITE_POINT,
        icon() {
          return iconPoint(true)
        },
        components: {
          ty: "r64",
          at: [
            [(x) => x.x, (x) => `${x}.xy`],
            [(x) => x.y, (x) => `${x}.zw`],
          ],
        },
      },
      point32: {
        name: "point",
        namePlural: "points",
        glsl: "vec2",
        garbage: { js: pt(real(NaN), real(NaN)), glsl: "vec2(0.0/0.0)" },
        coerce: {},
        write: WRITE_POINT,
        icon() {
          return iconPoint(false)
        },
        components: {
          ty: "r32",
          at: [
            [(x) => x.x, (x) => `${x}.x`],
            [(x) => x.y, (x) => `${x}.y`],
          ],
        },
      },
    },
  },
  eval: {
    fns: {
      screendistance: FN_SCREENDISTANCE,
    },
  },
  sheet: {
    exts: {
      1: [EXT_POINT],
    },
    toolbar: {
      1: [picker(() => iconPoint(false), PICK_POINT)],
    },
    keys: {
      p: (sheet: Sheet) => sheet.setPick(PICK_BY_TY, PICK_POINT),
    },
  },
}

function iconPoint(hd: boolean) {
  return h(
    "",
    h(
      "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px]" +
        (hd ? " border-double border-[3px]" : " border-2"),
      h(
        "opacity-25 block bg-current absolute " +
          (hd ? " -inset-[2px] rounded-[2px]" : "inset-0"),
      ),
      h(
        "size-[7px] bg-current absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      ),
      hd ? highRes() : null,
    ),
  )
}
