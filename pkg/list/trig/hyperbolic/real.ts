import { FnDist } from "@/eval/ops/dist"
import { approx, num } from "@/eval/ty/create"
import type { Package } from "#/types"
import { PKG_REAL } from "../../num/real"

const FN_SINH = new FnDist("sinh", "takes the hyperbolic sinhe of an angle")
const FN_COSH = new FnDist("cosh", "takes the hyperbolic coshine of an angle")
const FN_TANH = new FnDist("tanh", "takes the hyperbolic tanhgent of an angle")
const FN_CSCH = new FnDist("csch", "takes the hyperbolic cosecant of an angle")
const FN_SECH = new FnDist("sech", "takes the hyperbolic secant of an angle")
const FN_COTH = new FnDist("coth", "takes the hyperbolic cotangent of an angle")

const FN_ARSINH = new FnDist(
  "arsinh",
  "takes the inverse hyperbolic sine of a value",
)
const FN_ARCOSH = new FnDist(
  "arcosh",
  "takes the inverse hyperbolic cosine of a value",
)
const FN_ARTANH = new FnDist(
  "artanh",
  "takes the inverse hyperbolic tangent of a value",
)
const FN_ARCSCH = new FnDist(
  "arcsch",
  "takes the inverse hyperbolic cosecant of a value",
)
const FN_ARSECH = new FnDist(
  "arsech",
  "takes the inverse hyperbolic secant of a value",
)
const FN_ARCOTH = new FnDist(
  "arcoth",
  "takes the inverse hyperbolic cotangent of a value",
)

export const PKG_TRIG_HYPERBOLIC_REAL: Package = {
  id: "nya:trigh-real",
  name: "hyperbolic trigonometry",
  label: "hyperbolic trig on real numbers",
  category: "trigonometry",
  load() {
    FN_SINH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.sinh(num(a.value))),
      (_, a) => `sinh(${a.expr})`,
      "sinh(ln 2)=0.75",
    )

    FN_COSH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.cosh(num(a.value))),
      (_, a) => `cosh(${a.expr})`,
      "cosh(ln 2)=1.25",
    )

    FN_TANH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.tanh(num(a.value))),
      (_, a) => `tanh(${a.expr})`,
      "tanh(ln 2)=0.6",
    )

    FN_CSCH.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.sinh(num(a.value))),
      (_, a) => `(1.0/sinh(${a.expr}))`,
      "csch(ln 2)=\\frac43",
    )

    FN_SECH.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.cosh(num(a.value))),
      (_, a) => `(1.0/cosh(${a.expr}))`,
      "sech(ln 2)=0.8",
    )

    FN_COTH.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.tanh(num(a.value))),
      (_, a) => `(1.0/tanh(${a.expr}))`,
      "coth(ln 2)=\\frac53",
    )

    // DOCS: remove parentheses from trig fns
    FN_ARSINH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.asinh(num(a.value))),
      (_, a) => `asinh(${a.expr})`,
      "arsinh(2)≈1.4436",
    )

    FN_ARCOSH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.acosh(num(a.value))),
      (_, a) => `acosh(${a.expr})`,
      "arcosh(2)≈1.3170",
    )

    FN_ARTANH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.atanh(num(a.value))),
      (_, a) => `atanh(${a.expr})`,
      "artanh(0.3)≈0.3095",
    )

    FN_ARCSCH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.asinh(1 / num(a.value))),
      (_, a) => `asinh(1.0/${a.expr})`,
      "arcsch(3)≈0.3275",
    )

    FN_ARSECH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.acosh(1 / num(a.value))),
      (_, a) => `acosh(1.0/${a.expr})`,
      "arsech(0.3)≈1.8738",
    )

    FN_ARCOTH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.atanh(1 / num(a.value))),
      (_, a) => `atanh(1.0/${a.expr})`,
      "arcoth(3)≈0.3466",
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
      arsinh: FN_ARSINH,
      arcosh: FN_ARCOSH,
      artanh: FN_ARTANH,
      arcsch: FN_ARCSCH,
      arsech: FN_ARSECH,
      arcoth: FN_ARCOTH,
      arcsinh: FN_ARSINH,
      arccosh: FN_ARCOSH,
      arctanh: FN_ARTANH,
      arccsch: FN_ARCSCH,
      arcsech: FN_ARSECH,
      arccoth: FN_ARCOTH,
      "sinh^-1": FN_ARSINH,
      "cosh^-1": FN_ARCOSH,
      "tanh^-1": FN_ARTANH,
      "csch^-1": FN_ARCSCH,
      "sech^-1": FN_ARSECH,
      "coth^-1": FN_ARCOTH,
      "arsinh^-1": FN_SINH,
      "arcosh^-1": FN_COSH,
      "artanh^-1": FN_TANH,
      "arcsch^-1": FN_CSCH,
      "arsech^-1": FN_SECH,
      "arcoth^-1": FN_COTH,
      "arcsinh^-1": FN_SINH,
      "arccosh^-1": FN_COSH,
      "arctanh^-1": FN_TANH,
      "arccsch^-1": FN_CSCH,
      "arcsech^-1": FN_SECH,
      "arccoth^-1": FN_COTH,
    },
  },
}
