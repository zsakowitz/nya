import type { Package } from "."
import { FnDist } from "../eval/ops/dist"
import { approx, num } from "../eval/ty/create"
import { PKG_REAL } from "./num/real"

const FN_SINH = new FnDist("sinh", "takes the hyperbolic sinhe of an angle")
const FN_COSH = new FnDist("cosh", "takes the hyperbolic coshine of an angle")
const FN_TANH = new FnDist("tanh", "takes the hyperbolic tanhgent of an angle")
const FN_CSCH = new FnDist("csch", "takes the hyperbolic cosecant of an angle")
const FN_SECH = new FnDist("sech", "takes the hyperbolic secant of an angle")
const FN_COTH = new FnDist("coth", "takes the hyperbolic cotangent of an angle")

const FN_ARCSINH = new FnDist(
  "arcsinh",
  "takes the inverse hyperbolic sine of a value",
)
const FN_ARCCOSH = new FnDist(
  "arccosh",
  "takes the inverse hyperbolic cosine of a value",
)
const FN_ARCTANH = new FnDist(
  "arctanh",
  "takes the inverse hyperbolic tangent of a value",
)
const FN_ARCCSCH = new FnDist(
  "arccsch",
  "takes the inverse hyperbolic cosecant of a value",
)
const FN_ARCSECH = new FnDist(
  "arcsech",
  "takes the inverse hyperbolic secant of a value",
)
const FN_ARCCOTH = new FnDist(
  "arccoth",
  "takes the inverse hyperbolic cotangent of a value",
)

export const PKG_TRIG_HYPERBOLIC_REAL: Package = {
  id: "nya:trigh-real",
  name: "hyperbolic trigonometry",
  label: "hyperbolic trig on real numbers",
  load() {
    FN_SINH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.sinh(num(a.value))),
      (_, a) => `sinh(${a.expr})`,
    )

    FN_COSH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.cosh(num(a.value))),
      (_, a) => `cosh(${a.expr})`,
    )

    FN_TANH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.tanh(num(a.value))),
      (_, a) => `tanh(${a.expr})`,
    )

    FN_CSCH.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.sinh(num(a.value))),
      (_, a) => `(1.0/sinh(${a.expr}))`,
    )

    FN_SECH.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.cosh(num(a.value))),
      (_, a) => `(1.0/cosh(${a.expr}))`,
    )

    FN_COTH.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.tanh(num(a.value))),
      (_, a) => `(1.0/tanh(${a.expr}))`,
    )

    FN_ARCSINH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.asinh(num(a.value))),
      (_, a) => `asinh(${a.expr})`,
    )

    FN_ARCCOSH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.acosh(num(a.value))),
      (_, a) => `acosh(${a.expr})`,
    )

    FN_ARCTANH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.atanh(num(a.value))),
      (_, a) => `atanh(${a.expr})`,
    )

    FN_ARCCSCH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.asinh(1 / num(a.value))),
      (_, a) => `asinh(1.0/${a.expr})`,
    )

    FN_ARCSECH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.acosh(1 / num(a.value))),
      (_, a) => `acosh(1.0/${a.expr})`,
    )

    FN_ARCCOTH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.atanh(1 / num(a.value))),
      (_, a) => `atanh(1.0/${a.expr})`,
    )
  },
  deps: [() => PKG_REAL],
  eval: {
    fn: {
      sinh: FN_SINH,
      cosh: FN_COSH,
      tanh: FN_TANH,
      csch: FN_CSCH,
      sech: FN_SECH,
      coth: FN_COTH,
      arcsinh: FN_ARCSINH,
      arccosh: FN_ARCCOSH,
      arctanh: FN_ARCTANH,
      arccsch: FN_ARCCSCH,
      arcsech: FN_ARCSECH,
      arccoth: FN_ARCCOTH,
      "sinh^-1": FN_ARCSINH,
      "cosh^-1": FN_ARCCOSH,
      "tanh^-1": FN_ARCTANH,
      "csch^-1": FN_ARCCSCH,
      "sech^-1": FN_ARCSECH,
      "coth^-1": FN_ARCCOTH,
    },
  },
}
