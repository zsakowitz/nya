import type { Package } from "."
import { FnDist } from "../eval/ops/dist"
import { approx, num } from "../eval/ty/create"
import { PKG_REAL } from "./num-real"

export const FN_SIN = new FnDist("sin", "takes the sine of an angle")
export const FN_COS = new FnDist("cos", "takes the cosine of an angle")
export const FN_TAN = new FnDist("tan", "takes the tangent of an angle")
export const FN_CSC = new FnDist("csc", "takes the cosecant of an angle")
export const FN_SEC = new FnDist("sec", "takes the secant of an angle")
export const FN_COT = new FnDist("cot", "takes the cotangent of an angle")

const FN_ARCSIN = new FnDist("arcsin", "takes the inverse sine of a value")
const FN_ARCCOS = new FnDist("arccos", "takes the inverse cosine of a value")
const FN_ARCTAN = new FnDist("arctan", "takes the inverse tangent of a value")
const FN_ARCCSC = new FnDist("arccsc", "takes the inverse cosecant of a value")
const FN_ARCSEC = new FnDist("arcsec", "takes the inverse secant of a value")
const FN_ARCCOT = new FnDist("arccot", "takes the inverse cotangent of a value")

export const PKG_TRIG_REAL: Package = {
  id: "nya:trig-real",
  name: "trigonometry",
  label: "trig on real numbers",
  init() {
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
    fns: {
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
