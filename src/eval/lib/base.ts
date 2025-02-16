import { add } from "../ops/op/add"
import { neg } from "../ops/op/neg"
import type { GlslValue, JsValue, SExact, SReal } from "../ty"
import { canCoerce, coerceValJs } from "../ty/coerce"
import { approx, frac, num } from "../ty/create"
import { splitValue } from "../ty/split"

export function asNumericBase(value: JsValue): SReal {
  if (value.list !== false) {
    throw new Error("Currently, only single real numbers can be bases.")
  }

  if (!canCoerce(value.type, "r32")) {
    throw new Error("Currently, only real numbers can be bases.")
  }

  return coerceValJs(value, "r32").value
}

function digitValue(char: string, base: SExact) {
  if ("0" <= char && char <= "9") {
    if (+char >= Math.abs(base.n)) {
      throw new Error(`The digit ${char} is invalid in base ${base.n}.`)
    }
    return +char
  } else if ("a" <= char && char <= "z") {
    const val = char.charCodeAt(0) - "a".charCodeAt(0) + 10
    if (val >= Math.abs(base.n)) {
      throw new Error(`The digit ${char} is invalid in base ${base.n}.`)
    }
    return val
  } else {
    throw new Error(`Unknown digit ${char}.`)
  }
}

function parseExact(text: string, base: SExact): SReal {
  let isNeg = false

  if (text[0] == "-") {
    isNeg = true
    text = text.slice(1)
  } else if (text[0] == "+") {
    text = text.slice(1)
  }

  const [a, b] = text.split(".") as [string, string?]

  let total = frac(0, 1)

  for (let i = 0; i < a.length; i++) {
    const value = digitValue(a[i]!, base)
    const place = a.length - i - 1
    total = add(total, frac(value * base.n ** place, base.d ** place))
  }

  if (b) {
    for (let j = 0; j < b.length; j++) {
      const value = digitValue(b[j]!, base)
      const place = j + 1
      total = add(total, frac(value * base.d ** place, base.n ** place))
    }
  }

  return isNeg ? neg(total) : total
}

function parse(text: string, base: SReal): SReal {
  if (num(base) == 10) {
    const value = +text
    if (text[text.length - 1] == ".") text = text.slice(0, -1)
    if (text[0] == ".") text = "0" + text
    if (text[0] == "-.") text = "-0." + text.slice(3)
    if ("" + value == text) {
      const decimal = text.indexOf(".")
      if (decimal == -1) {
        return { type: "exact", n: value, d: 1 }
      } else {
        const n = parseInt(text.replace(".", ""), 10)
        return frac(n, 10 ** (text.length - decimal - 1))
      }
    } else {
      return approx(value)
    }
  }

  if (base.type == "exact") {
    return parseExact(text, base)
  }

  throw new Error(
    "For now, bases must be exact numbers or fractions, so try using a number like 2 or 16 or ⅝.",
  )
}

export function parseNumberJs(
  text: string,
  base: SReal,
): JsValue<"r64", false> {
  return {
    type: "r64",
    list: false,
    value: parse(text, base),
  }
}

function parseNumberGlslVal(text: string, base: SReal): string {
  const value = num(parse(text, base))
  if (value == 1 / 0) {
    return `vec2(1.0/0.0, 0)`
  }
  if (value == -1 / 0) {
    return `vec2(-1.0/0.0, 0)`
  }
  if (value == 0 / 0) {
    return `vec2(0.0/0.0)`
  }
  return splitValue(value).expr
}

export function parseNumberGlsl(
  text: string,
  base: SReal,
): GlslValue<"r64", false> {
  return {
    type: "r64",
    list: false,
    expr: parseNumberGlslVal(text, base),
  }
}
