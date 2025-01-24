import { add } from "../ops/op/add"
import type { GlslValue, JsValue, SExact, SReal } from "../ty"
import { canCoerce, coerceValJs } from "../ty/coerce"
import { approx, frac, num } from "../ty/create"
import { splitValue } from "../ty/split"
import { safe } from "./util"

export function asNumericBase(value: JsValue): SReal {
  if (value.list !== false) {
    throw new Error("Currently, only single real numbers can be bases.")
  }

  if (!canCoerce(value.type, "r32")) {
    throw new Error("Currently, only real numbers can be bases.")
  }

  return coerceValJs(value, "r32").value
}

export function digitValue(char: string, base: SExact) {
  if ("0" <= char && char <= "9") {
    if (+char >= Math.abs(base.n)) {
      throw new Error(`The digit ${char} is invalid in base ${base.n}.`)
    }
    return +char
  } else {
    throw new Error(`Unknown digit ${char}.`)
  }
}

export function parse(text: string, base: SExact): SReal {
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

  return total
}

export function parseNumberJsVal(text: string, base: SReal): SReal {
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
    return parse(text, base)
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
    value: parseNumberJsVal(text, base),
  }
}

function parseNumberGlslInner(text: string, base: SReal): number {
  const numericValue = base.type == "exact" ? base.n / base.d : base.value

  if (numericValue == 10) {
    return +text
  }

  if (
    numericValue &&
    safe(numericValue) &&
    2 <= numericValue &&
    numericValue <= 36 &&
    text.indexOf(".") == -1
  ) {
    const int = parseInt(text, numericValue)
    if (int != int) {
      throw new Error(`${text} is not valid in base ${numericValue}.`)
    }
    return int
  }

  throw new Error(
    "Bases other than 2-36 and evaluating a non-integer in a particular base are not suppported yet.",
  )
}

export function parseNumberGlslVal(text: string, base: SReal): string {
  const value = parseNumberGlslInner(text, base)
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
