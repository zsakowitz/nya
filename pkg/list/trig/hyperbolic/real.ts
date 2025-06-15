import { chaind, OP_JUXTAPOSE, OP_NEG, symSquare } from "#/list/core/ops"
import type { Package } from "#/types"
import { FnDist } from "@/eval/ops/dist"
import { cl } from "@/eval/sym"
import { approx } from "@/lib/real"

export const FN_SINH: FnDist = new FnDist(
  "sinh",
  "takes the hyperbolic sinhe of an angle",
  chaind((a) => cl(FN_COSH, a)),
)
export const FN_COSH: FnDist = new FnDist(
  "cosh",
  "takes the hyperbolic coshine of an angle",
  chaind((a) => cl(FN_SINH, a)),
)
export const FN_TANH: FnDist = new FnDist(
  "tanh",
  "takes the hyperbolic tanhgent of an angle",
  chaind((a) => symSquare(cl(FN_SECH, a))),
)
export const FN_CSCH: FnDist = new FnDist(
  "csch",
  "takes the hyperbolic cosecant of an angle",
  chaind((a) => cl(OP_NEG, cl(OP_JUXTAPOSE, cl(FN_COTH, a), cl(FN_CSCH, a)))),
)
export const FN_SECH: FnDist = new FnDist(
  "sech",
  "takes the hyperbolic secant of an angle",
  chaind((a) => cl(OP_NEG, cl(OP_JUXTAPOSE, cl(FN_TANH, a), cl(FN_SECH, a)))),
)
export const FN_COTH: FnDist = new FnDist(
  "coth",
  "takes the hyperbolic cotangent of an angle",
  chaind((a) => cl(OP_NEG, symSquare(cl(FN_CSCH, a)))),
)

export const FN_ARSINH: FnDist = new FnDist(
  "arsinh",
  "takes the inverse hyperbolic sine of a value",
)
export const FN_ARCOSH: FnDist = new FnDist(
  "arcosh",
  "takes the inverse hyperbolic cosine of a value",
)
export const FN_ARTANH: FnDist = new FnDist(
  "artanh",
  "takes the inverse hyperbolic tangent of a value",
)
export const FN_ARCSCH: FnDist = new FnDist(
  "arcsch",
  "takes the inverse hyperbolic cosecant of a value",
)
export const FN_ARSECH: FnDist = new FnDist(
  "arsech",
  "takes the inverse hyperbolic secant of a value",
)
export const FN_ARCOTH: FnDist = new FnDist(
  "arcoth",
  "takes the inverse hyperbolic cotangent of a value",
)

export default {
  name: "hyperbolic trigonometry",
  label: "hyperbolic trig on real numbers",
  category: "trigonometry",
  load() {
    FN_SINH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.sinh(a.value.num())),
      (_, a) => `sinh(${a.expr})`,
      "sinh(ln 2)=0.75",
    )

    FN_COSH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.cosh(a.value.num())),
      (_, a) => `cosh(${a.expr})`,
      "cosh(ln 2)=1.25",
    )

    FN_TANH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.tanh(a.value.num())),
      (_, a) => `tanh(${a.expr})`,
      "tanh(ln 2)=0.6",
    )

    FN_CSCH.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.sinh(a.value.num())),
      (_, a) => `(1.0/sinh(${a.expr}))`,
      "csch(ln 2)=\\frac43",
    )

    FN_SECH.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.cosh(a.value.num())),
      (_, a) => `(1.0/cosh(${a.expr}))`,
      "sech(ln 2)=0.8",
    )

    FN_COTH.add(
      ["r32"],
      "r32",
      (a) => approx(1 / Math.tanh(a.value.num())),
      (_, a) => `(1.0/tanh(${a.expr}))`,
      "coth(ln 2)=\\frac53",
    )

    // DOCS: remove parentheses from trig fns
    FN_ARSINH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.asinh(a.value.num())),
      (_, a) => `asinh(${a.expr})`,
      "arsinh(2)≈1.4436",
    )

    FN_ARCOSH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.acosh(a.value.num())),
      (_, a) => `acosh(${a.expr})`,
      "arcosh(2)≈1.3170",
    )

    FN_ARTANH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.atanh(a.value.num())),
      (_, a) => `atanh(${a.expr})`,
      "artanh(0.3)≈0.3095",
    )

    FN_ARCSCH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.asinh(1 / a.value.num())),
      (_, a) => `asinh(1.0/${a.expr})`,
      "arcsch(3)≈0.3275",
    )

    FN_ARSECH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.acosh(1 / a.value.num())),
      (_, a) => `acosh(1.0/${a.expr})`,
      "arsech(0.3)≈1.8738",
    )

    FN_ARCOTH.add(
      ["r32"],
      "r32",
      (a) => approx(Math.atanh(1 / a.value.num())),
      (_, a) => `atanh(1.0/${a.expr})`,
      "arcoth(3)≈0.3466",
    )
  },
  deps: ["num/real"],
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
} satisfies Package
