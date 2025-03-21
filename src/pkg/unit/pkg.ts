// TODO: this basically needs meta properties in the type system
// to work in shaders

import { issue } from "@/eval/ops/issue"
import type { Builtin } from "@/eval/ops/vars"
import type { JsValue } from "@/eval/ty"
import { num, real } from "@/eval/ty/create"
import type { Display } from "@/eval/ty/display"
import type { TyInfoByName } from "@/eval/ty/info"
import { add, div, mul, neg, raise, sub } from "@/eval/ty/ops"
import { CmdNum } from "@/field/cmd/leaf/num"
import { OpCdot } from "@/field/cmd/leaf/op"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdFrac } from "@/field/cmd/math/frac"
import { CmdSupSub } from "@/field/cmd/math/supsub"
import { Block, L, R } from "@/field/model"
import { h, sx } from "@/jsx"
import type { Package } from ".."
import {
  OP_ADD,
  OP_CDOT,
  OP_DIV,
  OP_NEG,
  OP_POS,
  OP_RAISE,
  OP_SUB,
} from "../core/ops"
import {
  convert,
  exp,
  factor,
  inv,
  multiply,
  type UnitList,
} from "./impl/system"
import { nan, UNITS_BY_NAME } from "./impl/units"

declare module "@/eval/ty" {
  interface Tys {
    unit: UnitList
    r32u: [SReal, UnitList]
  }

  interface TyComponents {
    unit: never
    r32u: never
  }
}

const glsl = issue("Cannot use units in shaders yet.")

function displayUnitPart(list: UnitList, display: Display, frac: boolean) {
  if (list.length == 0 && frac) {
    new CmdNum("1").insertAt(display.cursor, L)
    return
  }

  let first = true
  for (const {
    exp,
    unit: { label },
  } of list) {
    if (first) {
      first = false
    } else {
      new OpCdot().insertAt(display.cursor, L)
    }
    const ev = num(exp)
    if (ev == 0) continue
    new CmdWord(label, "var").insertAt(display.cursor, L)
    if (ev != 1) {
      const sup = new Block(null)
      display.at(sup.cursor(R)).num(exp)
      new CmdSupSub(null, sup).insertAt(display.cursor, L)
    }
  }
}

function displayUnit(list: UnitList, props: Display, require: boolean) {
  const high = list.filter((x) => !(num(x.exp) < 0))
  const low = inv(list.filter((x) => num(x.exp) < 0))

  if (low.length != 0) {
    const num = new Block(null)
    displayUnitPart(high, props.at(num.cursor(R)), true)
    const denom = new Block(null)
    displayUnitPart(low, props.at(denom.cursor(R)), true)
    new CmdFrac(num, denom).insertAt(props.cursor, L)
  } else if (high.length == 0) {
    if (require) {
      new CmdWord("unitless", "var").insertAt(props.cursor, L)
    }
  } else {
    displayUnitPart(high, props, false)
  }
}

const INFO_UNIT: TyInfoByName<"unit"> = {
  name: "unit",
  namePlural: "units",
  get glsl() {
    return glsl()
  },
  toGlsl: glsl,
  garbage: {
    js: [{ exp: real(1), unit: nan }],
    get glsl() {
      return glsl()
    },
  },
  coerce: {
    r32u: {
      js(self) {
        return [real(1), self]
      },
      glsl,
    },
  },
  write: {
    display(value, props) {
      displayUnit(value, props, true)
    },
    isApprox() {
      return false
    },
  },
  order: null,
  point: false,
  icon() {
    return h(
      "",
      h(
        "text-[#00786F] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        sx(
          "svg",
          {
            class:
              "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible",
            viewBox: "0 0 16 16",
            fill: "none",
          },
          sx("path", {
            d: "M 5 0 L 16 11 L 11 16 L 0 5 Z M 5.5 10.5 l 3 -3 M 2.75 7.75 l 1.5 -1.5 M 8.25 13.25 l 1.5 -1.5",
            stroke: "currentcolor",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": 2,
          }),
        ),
      ),
    )
  },
  // TODO: token changes depending on unit
  token: null,
  glide: null,
  preview: null,
  components: null,
  extras: null,
}

const INFO_R32U: TyInfoByName<"r32u"> = {
  name: "real number with a unit",
  namePlural: "real numbers with units",
  get glsl() {
    return glsl()
  },
  toGlsl: glsl,
  garbage: {
    js: [real(NaN), [{ exp: real(1), unit: nan }]],
    get glsl() {
      return glsl()
    },
  },
  coerce: {},
  write: {
    display([value, unit], props) {
      props.num(value)
      displayUnit(unit, props, false)
    },
    isApprox() {
      return false
    },
  },
  order: null,
  point: false,
  icon() {
    return h(
      "",
      h(
        "text-[#00786F] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        sx(
          "svg",
          {
            class:
              "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible",
            viewBox: "0 0 16 16",
            fill: "none",
          },
          sx("path", {
            d: "M 5 0 L 16 11 L 11 16 L 0 5 Z M 5.5 10.5 l 3 -3 M 2.75 7.75 l 1.5 -1.5 M 8.25 13.25 l 1.5 -1.5",
            stroke: "currentcolor",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": 2,
          }),
        ),
      ),
    )
  },
  // TODO: token changes depending on unit
  token: null,
  glide: null,
  preview: null,
  components: null,
  extras: null,
}

OP_CDOT.add(
  ["unit", "unit"],
  "unit",
  (a, b) => multiply(a.value, b.value),
  glsl,
)

OP_CDOT.add(
  ["r32u", "r32u"],
  "r32u",
  (a, b) => [mul(a.value[0], b.value[0]), multiply(a.value[1], b.value[1])],
  glsl,
)

OP_DIV.add(
  ["unit", "unit"],
  "unit",
  (a, b) => multiply(a.value, inv(b.value)),
  glsl,
)

OP_DIV.add(
  ["r32u", "r32u"],
  "r32u",
  (a, b) => [
    div(a.value[0], b.value[0]),
    multiply(a.value[1], inv(b.value[1])),
  ],
  glsl,
)

OP_RAISE.add(["unit", "r32"], "unit", (a, b) => exp(a.value, b.value), glsl)

OP_RAISE.add(
  ["r32u", "r32"],
  "r32u",
  (a, b) => [raise(a.value[0], b.value), exp(a.value[1], b.value)],
  glsl,
)

OP_ADD.add(
  ["r32u", "r32u"],
  "r32u",
  ({ value: [v1, u1] }, { value: [v2, u2] }) => {
    const f21 = factor(u2, u1)
    return [add(v1, convert(v2, f21)), u1]
  },
  glsl,
)

OP_SUB.add(
  ["r32u", "r32u"],
  "r32u",
  ({ value: [v1, u1] }, { value: [v2, u2] }) => {
    const f21 = factor(u2, u1)
    return [sub(v1, convert(v2, f21)), u1]
  },
  glsl,
)

OP_POS.add(["unit"], "unit", (a) => a.value, glsl)

OP_POS.add(["r32u"], "r32u", (a) => a.value, glsl)

OP_NEG.add(["r32u"], "r32u", ({ value: [a, u] }) => [neg(a), u], glsl)

export const PKG_UNITS: Package = {
  id: "nya:units",
  name: "units",
  label: "no more conversion factors",
  ty: {
    info: {
      unit: INFO_UNIT,
      r32u: INFO_R32U,
    },
    coerce: {
      r32: {
        r32u: {
          js(self) {
            return [self, []]
          },
          glsl,
        },
      },
    },
  },
  eval: {
    var: Object.fromEntries(
      Object.entries(UNITS_BY_NAME).map(([k, unit]): [string, Builtin] => [
        k,
        {
          js: {
            type: "unit",
            list: false,
            value: [{ exp: real(1), unit }],
          } satisfies JsValue<"unit">,
          get glsl() {
            return glsl()
          },
          display: true,
          label: "", // FIXME: actual label
        },
      ]),
    ),
  },
}
