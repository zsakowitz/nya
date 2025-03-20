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
  load() {
    FN_SIN.add(
      ["r32"],
      "r32",
      (a) => approx(Math.sin(num(a.value))),
      (_, a) => `sin(${a.expr})`,
    )

    FN_COS.add(
      ["r32"],
      "r32",
      (a) => approx(Math.cos(num(a.value))),
      (_, a) => `cos(${a.expr})`,
    )

    FN_TAN.add(
      ["r32"],
      "r32",
      (a) => approx(Math.tan(num(a.value))),
      (_, a) => `tan(${a.expr})`,
    )

    FN_CSC.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.sin(num(a.value))),
      (_, a) => `(1.0/sin(${a.expr}))`,
    )

    FN_SEC.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.cos(num(a.value))),
      (_, a) => `(1.0/cos(${a.expr}))`,
    )

    FN_COT.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.tan(num(a.value))),
      (_, a) => `(1.0/tan(${a.expr}))`,
    )

    FN_ARCSIN.add(
      ["r32"],
      "r32",
      (a) => approx(Math.asin(num(a.value))),
      (_, a) => `asin(${a.expr})`,
    )

    FN_ARCCOS.add(
      ["r32"],
      "r32",
      (a) => approx(Math.acos(num(a.value))),
      (_, a) => `acos(${a.expr})`,
    )

    FN_ARCTAN.add(
      ["r32"],
      "r32",
      (a) => approx(Math.atan(num(a.value))),
      (_, a) => `atan(${a.expr})`,
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => approx(Math.atan2(num(a.value), num(b.value))),
      (_, a, b) => `atan(${a.expr}, ${b.expr})`,
    )

    FN_ARCCSC.add(
      ["r32"],
      "r32",
      (a) => approx(Math.asin(1 / num(a.value))),
      (_, a) => `asin(1.0/${a.expr})`,
    )

    FN_ARCSEC.add(
      ["r32"],
      "r32",
      (a) => approx(Math.acos(1 / num(a.value))),
      (_, a) => `acos(1.0/${a.expr})`,
    )

    FN_ARCCOT.add(
      ["r32"],
      "r32",
      (a) => approx(Math.atan(1 / num(a.value))),
      (_, a) => `atan(1.0/${a.expr})`,
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
