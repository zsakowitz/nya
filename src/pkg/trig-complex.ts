import type { Package } from "."
import {
  cosPt,
  declareCos,
  declareDiv,
  declareSin,
  divPt,
  PKG_NUM_COMPLEX,
  sinPt,
} from "./num-complex"
import { FN_COS, FN_SIN, FN_TAN, PKG_TRIG_REAL } from "./trig-real"

export const PKG_TRIG_COMPLEX: Package = {
  id: "nya:trig-complex",
  name: "trigonometry on complex numbers",
  label: "adds standard trig functions for complex numbers",
  deps: [() => PKG_TRIG_REAL, () => PKG_NUM_COMPLEX],
  eval: {
    fns: {
      sin: FN_SIN,
      cos: FN_COS,
      tan: FN_TAN,
    },
  },
  init() {
    FN_SIN.add(
      ["c32"],
      "c32",
      (a) => sinPt(a.value),
      (ctx, a) => {
        declareSin(ctx)
        return `_helper_sin(${a})`
      },
    )

    FN_COS.add(
      ["c32"],
      "c32",
      (a) => cosPt(a.value),
      (ctx, a) => {
        declareCos(ctx)
        return `_helper_cos(${a})`
      },
    )

    FN_TAN.add(
      ["c32"],
      "c32",
      (a) => divPt(sinPt(a.value), cosPt(a.value)),
      (ctx, a) => {
        declareDiv(ctx)
        declareSin(ctx)
        declareCos(ctx)
        // TODO: this probably has lots of redundant terms
        ctx.glsl`vec2 _helper_tan(vec2 a) {
  return _helper_div(_helper_sin(a), _helper_cos(a));
}
`
        return `_helper_tan(${a.expr})`
      },
    )
  },
}
