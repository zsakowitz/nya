import { FnDist } from "@/eval/ops/dist"
import { SYM_2, unary } from "@/eval/sym"
import { approx, num } from "@/eval/ty/create"
import type { Package } from ".."
import { chain, OP_NEG, OP_RAISE } from "../core/ops"
import { PKG_REAL } from "../num/real"

const FN_SIN: FnDist = new FnDist("sin", "takes the sine of an angle", {
  deriv: unary((wrt, a) =>
    chain(a, wrt, { type: "call", fn: FN_COS, args: [a] }),
  ),
})

const FN_COS: FnDist = new FnDist("cos", "takes the cosine of an angle", {
  deriv: unary((wrt, a) =>
    chain(a, wrt, {
      type: "call",
      fn: OP_NEG,
      args: [{ type: "call", fn: FN_SIN, args: [a] }],
    }),
  ),
})

const FN_TAN = new FnDist("tan", "takes the tangent of an angle", {
  deriv: unary((wrt, a) =>
    chain(a, wrt, {
      type: "call",
      fn: OP_RAISE,
      args: [{ type: "call", fn: FN_SEC, args: [a] }, SYM_2],
    }),
  ),
})
const FN_CSC = new FnDist("csc", "takes the cosecant of an angle")
const FN_SEC = new FnDist("sec", "takes the secant of an angle")
const FN_COT = new FnDist("cot", "takes the cotangent of an angle")

export { FN_COS, FN_COT, FN_CSC, FN_SEC, FN_SIN, FN_TAN }

const FN_ARCSIN = new FnDist("arcsin", "takes the inverse sine of a value")
const FN_ARCCOS = new FnDist("arccos", "takes the inverse cosine of a value")
const FN_ARCTAN = new FnDist("arctan", "takes the inverse tangent of a value")
const FN_ARCCSC = new FnDist("arccsc", "takes the inverse cosecant of a value")
const FN_ARCSEC = new FnDist("arcsec", "takes the inverse secant of a value")
const FN_ARCCOT = new FnDist("arccot", "takes the inverse cotangent of a value")

export { FN_ARCCOS, FN_ARCCOT, FN_ARCCSC, FN_ARCSEC, FN_ARCSIN, FN_ARCTAN }

export const PKG_TRIG_REAL: Package = {
  id: "nya:trig-real",
  name: "trigonometry",
  label: "trig on real numbers",
  category: "trigonometry",
  load() {
    FN_SIN.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(Math.sin(this.rad() * num(a.value)))
      },
      (ctx, a) => `sin(${ctx.rad()} * ${a.expr})`,
      "sin30°=0.5",
    )

    FN_COS.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(Math.cos(this.rad() * num(a.value)))
      },
      (ctx, a) => `cos(${ctx.rad()} * ${a.expr})`,
      "cos60°=0.5",
    )

    FN_TAN.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(Math.tan(this.rad() * num(a.value)))
      },
      (ctx, a) => `tan(${ctx.rad()} * ${a.expr})`,
      "tan45°=1",
    )

    FN_CSC.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(1 / Math.sin(this.rad() * num(a.value)))
      },
      (ctx, a) => `(1.0/sin(${ctx.rad()} * ${a.expr}))`,
      "csc30°=2",
    )

    FN_SEC.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(1 / Math.cos(this.rad() * num(a.value)))
      },
      (ctx, a) => `(1.0/cos(${ctx.rad()} * ${a.expr}))`,
      "sec60°=2",
    )

    FN_COT.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(1 / Math.tan(this.rad() * num(a.value)))
      },
      (ctx, a) => `(1.0/tan(${ctx.rad()} * ${a.expr}))`,
      "cot45°=1",
    )

    FN_ARCSIN.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(Math.asin(num(a.value)) / this.rad())
      },
      (ctx, a) => `(asin(${a.expr}) / ${ctx.rad()})`,
      "arcsin0.5=30°",
    )

    FN_ARCCOS.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(Math.acos(num(a.value)) / this.rad())
      },
      (ctx, a) => `(acos(${a.expr}) / ${ctx.rad()})`,
      "arccos0.5=60°",
    )

    FN_ARCTAN.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(Math.atan(num(a.value)) / this.rad())
      },
      (ctx, a) => `(atan(${a.expr}) / ${ctx.rad()})`,
      "arctan1=45°",
    ).add(
      ["r32", "r32"],
      "r32",
      function (a, b) {
        return approx(Math.atan2(num(a.value), num(b.value)) / this.rad())
      },
      (ctx, a, b) => `(atan(${a.expr}, ${b.expr}) / ${ctx.rad()})`,
      "arctan(-1,-1)=-135°",
    )

    FN_ARCCSC.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(Math.asin(1 / num(a.value)) / this.rad())
      },
      (ctx, a) => `(asin(1.0/${a.expr}) / ${ctx.rad()})`,
      "arccsc2=30°",
    )

    FN_ARCSEC.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(Math.acos(1 / num(a.value)) / this.rad())
      },
      (ctx, a) => `(acos(1.0/${a.expr}) / ${ctx.rad()})`,
      "arcsec2=60°",
    )

    FN_ARCCOT.add(
      ["r32"],
      "r32",
      function (a) {
        return approx(Math.atan(1 / num(a.value)) / this.rad())
      },
      (ctx, a) => `(atan(1.0/${a.expr}) / ${ctx.rad()})`,
      "arccot1=45°",
    )
  },
  deps: [() => PKG_REAL],
  eval: {
    fn: {
      sin: FN_SIN,
      cos: FN_COS,
      tan: FN_TAN,
      csc: FN_CSC,
      sec: FN_SEC,
      cot: FN_COT,
      arcsin: FN_ARCSIN,
      arccos: FN_ARCCOS,
      arctan: FN_ARCTAN,
      arccsc: FN_ARCCSC,
      arcsec: FN_ARCSEC,
      arccot: FN_ARCCOT,
      "sin^-1": FN_ARCSIN,
      "cos^-1": FN_ARCCOS,
      "tan^-1": FN_ARCTAN,
      "csc^-1": FN_ARCCSC,
      "sec^-1": FN_ARCSEC,
      "cot^-1": FN_ARCCOT,
    },
  },
}
