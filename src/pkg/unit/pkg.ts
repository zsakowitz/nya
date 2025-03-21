// TODO: this basically needs meta properties in the type system
// to work in shaders

import { issue } from "@/eval/ops/issue"
import type { Builtin } from "@/eval/ops/vars"
import type { JsValue } from "@/eval/ty"
import { num, real } from "@/eval/ty/create"
import type { Display } from "@/eval/ty/display"
import type { TyInfoByName } from "@/eval/ty/info"
import { OpCdot } from "@/field/cmd/leaf/op"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdFrac } from "@/field/cmd/math/frac"
import { CmdSupSub } from "@/field/cmd/math/supsub"
import { Block, L, R } from "@/field/model"
import { h, sx } from "@/jsx"
import type { Package } from ".."
import { OP_CDOT, OP_DIV, OP_RAISE } from "../core/ops"
import { exp, inv, multiply, type UnitList } from "./impl/system"
import { nan, UNITS_BY_NAME } from "./impl/units"

declare module "@/eval/ty" {
  interface Tys {
    unit: UnitList
  }

  interface TyComponents {
    unit: never
  }
}

const glsl = issue("Cannot use units in shaders yet.")

function display(list: UnitList, display: Display) {
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
  coerce: {},
  write: {
    display(value, props) {
      const high = value.filter((x) => !(num(x.exp) < 0))
      const low = inv(value.filter((x) => num(x.exp) < 0))

      if (low.length == 0) {
        display(high, props)
      } else {
        const num = new Block(null)
        display(high, props.at(num.cursor(R)))
        const denom = new Block(null)
        display(low, props.at(denom.cursor(R)))
        new CmdFrac(num, denom).insertAt(props.cursor, L)
      }
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

OP_DIV.add(
  ["unit", "unit"],
  "unit",
  (a, b) => multiply(a.value, inv(b.value)),
  glsl,
)

OP_RAISE.add(["unit", "r32"], "unit", (a, b) => exp(a.value, b.value), glsl)

export const PKG_UNITS: Package = {
  id: "nya:units",
  name: "units",
  label: "no more conversion factors",
  ty: {
    info: {
      unit: INFO_UNIT,
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
