import type { Package } from "."
import { fn } from "../eval/lib/fn"
import type { SPoint } from "../eval/ty"
import { approx, num, pt } from "../eval/ty/create"
import { divGl, divPt, PKG_NUM_COMPLEX, recipGl, recipPt } from "./num-complex"
import {
  FN_COS,
  FN_COT,
  FN_CSC,
  FN_SEC,
  FN_SIN,
  FN_TAN,
  PKG_TRIG_REAL,
} from "./trig-real"

function sinJs(a: SPoint) {
  return pt(
    approx(Math.sin(num(a.x)) * Math.cosh(num(a.y))),
    approx(Math.cos(num(a.x)) * Math.sinh(num(a.y))),
  )
}

const sinGl = fn(
  ["c32"],
  "c32",
)`return vec2(sin(${0}.x) * cosh(${0}.y), cos(${0}.x) * sinh(${0}.y));`

const cosGl = fn(
  ["c32"],
  "c32",
)`return vec2(cos(${0}.x) * cosh(${0}.y), -sin(${0}.x) * sinh(${0}.y));`

const tanGl = fn(
  ["c32"],
  "c32",
)`return ${divGl}(${sinGl}(${0}), ${cosGl}(${0}));`

const cscGl = fn(["c32"], "c32")`return ${recipGl}(${sinGl}(${0}));`

const secGl = fn(["c32"], "c32")`return ${recipGl}(${cosGl}(${0}));`

const cotGl = fn(
  ["c32"],
  "c32",
)`return ${divGl}(${cosGl}(${0}), ${sinGl}(${0}));`

function cosJs(a: SPoint): SPoint {
  return pt(
    approx(Math.cos(num(a.x)) * Math.cosh(num(a.y))),
    approx(-Math.sin(num(a.x)) * Math.sinh(num(a.y))),
  )
}

function tanJs(a: SPoint) {
  return divPt(sinJs(a), cosJs(a))
}

function cotJs(a: SPoint) {
  return divPt(cosJs(a), sinJs(a))
}

export const PKG_TRIG_COMPLEX: Package = {
  id: "nya:trig-complex",
  name: "trigonometry on complex numbers",
  label: null,
  deps: [() => PKG_TRIG_REAL, () => PKG_NUM_COMPLEX],
  eval: {
    fns: {
      sin: FN_SIN,
      cos: FN_COS,
      tan: FN_TAN,
      csc: FN_CSC,
      sec: FN_SEC,
      cot: FN_COT,
    },
  },
  load() {
    FN_SIN.add(["c32"], "c32", (a) => sinJs(a.value), sinGl)
    FN_COS.add(["c32"], "c32", (a) => cosJs(a.value), cosGl)
    FN_TAN.add(["c32"], "c32", (a) => tanJs(a.value), tanGl)
    FN_CSC.add(["c32"], "c32", (a) => recipPt(sinJs(a.value)), cscGl)
    FN_SEC.add(["c32"], "c32", (a) => recipPt(cosJs(a.value)), secGl)
    FN_COT.add(["c32"], "c32", (a) => cotJs(a.value), cotGl)
  },
}
