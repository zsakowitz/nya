// TODO: this basically needs meta properties in the type system
// to work in shaders

import type { Package } from "#/types"
import {
  OP_ADD,
  OP_CDOT,
  OP_DIV,
  OP_NEG,
  OP_POS,
  OP_RAISE,
  OP_SUB,
} from "$/core/ops"
import { example } from "@/docs/core"
import { Precedence } from "@/eval/ast/token"
import { NO_SYM, type WordInfo } from "@/eval/ast/tx"
import { FnDist } from "@/eval/ops/dist"
import { issue } from "@/eval/ops/issue"
import { binaryFn } from "@/eval/sym"
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
import { L, R } from "@/field/dir"
import { toText } from "@/field/latex"
import { Block } from "@/field/model"
import { b, h, px, sx } from "@/jsx"
import {
  assertCompat,
  badSum,
  convert,
  convertInv,
  exp,
  factor,
  inv,
  multiply,
  siUnit,
  toSI,
  type UnitList,
} from "./util/system"
import { nan, UNITS } from "./util/units"

declare module "@/eval/ty" {
  interface Tys {
    unit: UnitList
    r32u: [SReal, UnitList]
  }
}

declare module "@/eval/ast/token" {
  interface PuncListInfix {
    into: 0
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

export function displayUnit(list: UnitList, props: Display, require: boolean) {
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

function latexUnitPart(list: UnitList, frac: boolean): string {
  if (list.length == 0 && frac) {
    return "1"
  }

  let ret = ""
  let first = true
  for (const {
    exp,
    unit: { label },
  } of list) {
    if (first) {
      first = false
    } else {
      ret += "\\cdot "
    }
    const ev = num(exp)
    if (ev == 0) continue
    ret += `\\wordvar{${toText(label)}}`
    if (ev != 1) {
      ret += `^{${exp}}`
    }
  }

  return ret
}

export function latexUnit(list: UnitList, require: boolean): string {
  const high = list.filter((x) => !(num(x.exp) < 0))
  const low = inv(list.filter((x) => num(x.exp) < 0))

  if (low.length != 0) {
    const num = latexUnitPart(high, true)
    const denom = latexUnitPart(low, true)
    return `\\frac{${num}}{${denom}}`
  } else if (high.length == 0) {
    if (require) {
      return "\\wordvar{unitless}"
    } else {
      return ""
    }
  } else {
    return latexUnitPart(high, false)
  }
}

const INFO_UNIT: TyInfoByName<"unit"> = {
  name: "unit",
  namePlural: "units",
  get glsl(): never {
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
            "d": "M 5 0 L 16 11 L 11 16 L 0 5 Z M 5.5 10.5 l 3 -3 M 2.75 7.75 l 1.5 -1.5 M 8.25 13.25 l 1.5 -1.5",
            "stroke": "currentcolor",
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
              "size-[26px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            viewBox: "0 0 26 26",
            fill: "none",
          },
          sx("path", {
            "d": "M 7 0 v 3 M 13 0 v 5 M 19 0 v 3 M 7 26 v -3 M 13 26 v -5 M 19 26 v -3 M 0 7 h 3 M 0 13 h 5 M 0 19 h 3 M 26 7 h -3 M 26 13 h -5 M 26 19 h -3",
            "stroke": "currentcolor",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": 2,
          }),
        ),
        h(
          "absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_-_1.5px)] font-['Times_New_Roman'] italic text-[100%]",
          "x",
        ),
      ),
    )
  },
  // TODO: token changes depending on unit
  token: null,
  glide: null,
  preview: null,
  extras: null,
}

const FN_INTO = new FnDist("into", "converts values between units", {
  display: binaryFn(
    () => new CmdWord("into", "infix"),
    Precedence.UnitConversion,
  ),
})

const FN_INTOSI = new FnDist(
  "intosi",
  "converts a value to its component SI units",
)

export function checkUnit(node: WordInfo) {
  if (node.sub) {
    throw new Error("Cannot apply a subscript to 'unit'.")
  }
}

export default {
  name: "units",
  label: "conversion functions and unit decompositions",
  category: "measurement",
  deps: ["num/real", "core/ops"],
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
    op: {
      binary: {
        into: {
          precedence: Precedence.UnitConversion,
          fn: FN_INTO,
        },
      },
    },
    fn: {
      intosi: FN_INTOSI,
    },
    tx: {
      wordPrefix: {
        unit: {
          label: "returns the unit with a given symbol",
          js(node) {
            checkUnit(node)
            const unit = UNITS[node.value]
            if (unit) {
              return {
                type: "unit",
                list: false,
                value: [{ exp: real(1), unit }],
              } satisfies JsValue<"unit">
            }
            throw new Error(`Unit '${node.value}' is not defined.`)
          },
          glsl,
          sym: NO_SYM,
        },
      },
    },
  },
  load() {
    OP_CDOT.add(
      ["unit", "unit"],
      "unit",
      (a, b) => multiply(a.value, b.value),
      glsl,
      "unit mol \\cdot unit K = \\wordvar{mol} \\cdot \\wordvar{K}",
    )

    OP_CDOT.add(
      ["r32u", "r32u"],
      "r32u",
      (a, b) => [mul(a.value[0], b.value[0]), multiply(a.value[1], b.value[1])],
      glsl,
      "3 unit mol \\cdot 4 unit K = 12 \\wordvar{mol} \\cdot \\wordvar{K}",
    )

    OP_DIV.add(
      ["unit", "unit"],
      "unit",
      (a, b) => multiply(a.value, inv(b.value)),
      glsl,
      "unit mol ÷ unit K = \\frac \\wordvar{mol} \\wordvar K",
    )

    OP_DIV.add(
      ["r32u", "r32u"],
      "r32u",
      (a, b) => [
        div(a.value[0], b.value[0]),
        multiply(a.value[1], inv(b.value[1])),
      ],
      glsl,
      "6 unit mol ÷ 3 unit K = 2 \\frac \\wordvar{mol} \\wordvar K",
    )

    OP_RAISE.add(
      ["unit", "r32"],
      "unit",
      (a, b) => exp(a.value, b.value),
      glsl,
      "(unit ft)^2 = \\wordvar{ft}^2",
    )

    OP_RAISE.add(
      ["r32u", "r32"],
      "r32u",
      (a, b) => [raise(a.value[0], b.value), exp(a.value[1], b.value)],
      glsl,
      "(3 unit ft)^2 = 9 \\wordvar{ft}^2",
    )

    OP_ADD.add(
      ["r32u", "r32u"],
      "r32u",
      ({ value: [v1, u1] }, { value: [v2, u2] }) => {
        assertCompat(u1, u2)
        const f1 = toSI(u1)
        const f2 = toSI(u2)
        if (num(f1.offset) != 0 && num(f2.offset) != 0) {
          badSum(u1, u2)
        }
        const val = add(convert(v1, f1), convert(v2, f2))
        return [convertInv(val, f1), u1]
      },
      glsl,
      "3 unit m + 47 unit cm = 3.47 \\wordvar{m}",
    )

    OP_SUB.add(
      ["r32u", "r32u"],
      "r32u",
      ({ value: [v1, u1] }, { value: [v2, u2] }) => {
        assertCompat(u1, u2)
        const f1 = toSI(u1)
        const f2 = toSI(u2)
        if (num(f1.offset) != 0 && num(f2.offset) != 0) {
          badSum(u1, u2)
        }
        const val = sub(convert(v1, f1), convert(v2, f2))
        return [convertInv(val, f1), u1]
      },
      glsl,
      "3 unit m - 47 unit cm = 2.53 \\wordvar{m}",
    )

    OP_POS.add(["unit"], "unit", (a) => a.value, glsl, "+unit m = \\wordvar m")

    OP_POS.add(
      ["r32u"],
      "r32u",
      (a) => a.value,
      glsl,
      "+7 unit m = 7 \\wordvar m",
    )

    OP_NEG.add(
      ["r32u"],
      "r32u",
      ({ value: [a, u] }) => [neg(a), u],
      glsl,
      "-7 unit m = -7 \\wordvar m",
    )

    FN_INTO.add(
      ["r32u", "unit"],
      "r32u",
      (a, b) => {
        const f = factor(a.value[1], b.value)
        return [convert(a.value[0], f), b.value]
      },
      glsl,
      "(7 unit m) in unit cm = 700 \\wordvar{cm}",
    )

    FN_INTOSI.add(
      ["r32u"],
      "r32u",
      (a) => {
        const factor = toSI(a.value[1])
        const unit = siUnit(a.value[1])
        return [convert(a.value[0], factor), unit]
      },
      glsl,
      "intosi(7 unit cal)=29.288\\frac{\\wordvar{kg}\\cdot\\wordvar m^2}{\\wordvar s^2}",
    )
  },
  docs: [
    {
      name: "units",
      poster: "37.2\\frac{\\wordvar{kJ}}{\\wordvar{mol}\\cdot\\wordvar{K}}",
      render() {
        return [
          px`Type ${b("unit")} followed by a unit name to use that unit.`,
          example("2unitm", "=2\\wordvar{m}"),
          px`You can multiply and divide values of different units.`,
          example(
            "\\frac{2unitm}{7units*4unitmin}",
            "=0.07142857143\\frac\\wordvar m{\\wordvar s\\cdot\\wordvar{min}}",
          ),
          px`You can convert between various units with the ${b("into")} operator.`,
          example("(20unitdC)intounitdF", "=68\\wordvar{°F}"),
          px`Adding and subtracting prefers the first value's units, and requires the units to be compatiable.`,
          example("7unitm+89unitcm", "=7.89\\wordvar m"),
          px`You can use the ${b("intosi")} function to turn any unit value into its component SI units.`,
          example(
            "intosi(4unitcal)",
            "=16.736\\frac{\\wordvar{kg}\\cdot\\wordvar{m}^2}{\\wordvar s^2}",
          ),
          px`Units must be prefixed with ${b("unit")} to avoid mixing up unit names and variables you define; imagine if we banned using m, s, C, J, A, K, and more as variable names! To shorten a reused unit, just define it as a variable.`,
          example("m=unitm", null),
          example("s=units", null),
          example("h=unithr", null),
          example(
            "4\\frac{m}{s^2}in\\frac{m}{h^2}",
            "=51840000.0\\frac{\\wordvar{m}}{\\wordvar{hr}^2}",
          ),
          px`Since ${b("C")} and ${b("F")} are used for coulomb and farad, respectively, use ${b("dC")} and ${b("dF")} for celsius and fahrenheit (the small d stands for degree).`,
          px`The ${b("celsius")} and ${b("fahrenheit")} units have special behavior. See ${b("units (temperature)")} for more information, and for common errors you'll get when using these units.`,
        ]
      },
    },
    {
      name: "units (temperature)",
      poster: "2\\wordvar{°C}\\cdot7.8\\wordvar{∆°F}",
      render() {
        return [
          px`First: since ${b("C")} and ${b("F")} are used for coulomb and farad, respectively, use ${b("dC")} and ${b("dF")} for celsius and fahrenheit.`,
          px`Second: temperature units like ${b("celsius")} and ${b("fahrenheit")} do not start at absolute zero (you have to add, not just multiply, to convert between them).`,
          px`These units therefore come in two variants. The regular ${b("dC")} and ${b("dF")} units are used for measured temperature, and ${b("deltacelsius")} and ${b("deltafahrenheit")} (short form: ${b("ddC")} or ${b("ddF")}) are used for changes in temperature.`,
          px`If you measure the temperature outside, ${b("celsius")} is the appropriate. But if you measure a 4 degree drop in temperature, use ${b("deltacelsius")}. The same goes for the Fahrenheit-based variants.`,
          px`First problem: addition. Adding 2 °C and 3 °C is ambiguous, since it could mean 5 °C (adding the 2 and 3) or 278 °C (adding 3 °C in kelvin to 2 °C). project nya forces you to explain what you mean: either use ${b("deltacelsius")} to communicate that you want a 3 degree change, or convert to kelvin before adding.`,
          example(
            "2 unit dC + ((3 unit dC) into unit K)",
            "=278.15 \\wordvar{°C}",
          ),
          example("2 unit dC + 3 unit ddC", "=5 \\wordvar{°C}"),
          px`Second problem: ratios. Dividing 5 J by 3 °C is ambiguous, since it could mean 5 J for every change of 3 °C, or 5 J for every total 276 K (3 °C in kelvin). Again, project nya forces you to disambiguate: either use ${b("deltacelsius")}, or convert into kelvin.`,
          example(
            "\\frac{5 unit J}{(3 unit dC) into unit K}",
            "=0.01810610176\\frac\\wordvar J\\wordvar K",
          ),
          example(
            "\\frac{5 unit J}{3 unit ddC}",
            "=1.66666666667\\frac\\wordvar J\\wordvar K",
          ),
          px`Third problem: multiplication. Multiplying 2 °C and 3 °C is ambiguous, since it could be an addition of 2 °C for every 3 °C, the reverse problem, or an addition of 2 °C for every addition of 3 °C. Again, the solution is to disambiguate: either use ${b("deltacelsius")} or convert into kelvin.`,
          example(
            "2 unit dC \\cdot ((3 unit dC) into unit K)",
            "=552.3 \\wordvar{°C}\\cdot\\wordvar K",
          ),
          example(
            "2 unit dC \\cdot 3 unit ddC",
            "=6 \\wordvar{°C}\\cdot\\wordvar{∆°C}",
          ),
          px`(The upwards triangle is the Greek letter capital delta, which is normally used to denote a change in something.)`,
        ]
      },
    },
  ],
} satisfies Package

export { glsl as unitsInShadersError }
