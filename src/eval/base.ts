import type { SReal, JsValue } from "./ty"
import { approx, frac, safe } from "./ty/create"

export function parseNumberJs(text: string, base: SReal): SReal {
  const numericValue = base.type == "exact" ? base.n / base.d : base.value

  if (numericValue == 10) {
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
    if (safe(int)) {
      return { type: "exact", n: int, d: 1 }
    } else {
      return { type: "approx", value: int }
    }
  }

  throw new Error(
    "Bases other than 2-36 and evaluating a non-integer in a particular base are not suppported yet.",
  )
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

export function parseNumberGlsl(text: string, base: SReal): string {
  const value = parseNumberGlslInner(text, base)
  if (value == 1 / 0) {
    return `(1.0/0.0)`
  }
  if (value == -1 / 0) {
    return `(-1.0/0.0)`
  }
  if (value == 0 / 0) {
    return `(0.0/0.0)`
  }
  return value.toExponential()
}

export function asNumericBase(value: JsValue): SReal {
  if (value.list) {
    throw new Error("Currently, only single real numbers can be bases.")
  }

  if (value.type != "real") {
    throw new Error("Currently, only real numbers can be bases.")
  }

  return value.value
}
