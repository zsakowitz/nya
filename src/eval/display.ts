import { OpApprox, OpEq } from "../field/cmd/leaf/cmp"
import { CmdColor } from "../field/cmd/leaf/color"
import { CmdComma } from "../field/cmd/leaf/comma"
import { CmdDot } from "../field/cmd/leaf/dot"
import { CmdNum } from "../field/cmd/leaf/num"
import { OpMinus, OpPlus, OpTimes } from "../field/cmd/leaf/op"
import { SymInfinity } from "../field/cmd/leaf/sym"
import { CmdWord } from "../field/cmd/leaf/word"
import { CmdBrack } from "../field/cmd/math/brack"
import { CmdFrac } from "../field/cmd/math/frac"
import { CmdSupSub } from "../field/cmd/math/supsub"
import type { FieldInert } from "../field/field-inert"
import { Block, type Cursor, L, R } from "../field/model"
import type { Node } from "./ast/token"
import { js, type PropsJs } from "./eval"
import type { JsVal, JsValue, SColor, SPoint, SReal } from "./ty"
import { isReal } from "./ty/coerce"
import { frac, num, real } from "./ty/create"
import { safe } from "./util"

export function getOutputBase(node: Node, props: PropsJs): SReal {
  if (node.type == "op" && node.kind == "base" && node.b) {
    if (
      node.b.type == "var" &&
      !node.b.sub &&
      !node.b.sup &&
      node.b.kind == "var" &&
      (node.b.value == "meow" || node.b.value == "mrrp")
    ) {
      return { ...{ btw: node.b.value }, ...real(10) }
    }
    const value = js(node.b, { ...props, base: real(10) })
    if (value.list !== false) {
      throw new Error("Cannot output in a list of bases yet.")
    }
    if (!isReal(value)) {
      throw new Error("Cannot output in a non-real base yet.")
    }
    return value.value
  }

  return real(10)
}

function displayDigits(
  cursor: Cursor,
  digits: string,
  base: SReal,
  imag?: boolean,
) {
  if (digits == "1" && imag) digits = ""
  if (digits == "-1" && imag) digits = "-"

  if (typeof base == "object" && "btw" in base && base.btw == "meow") {
    digits = digits.replace(/\d/g, (x) => "mmrraaooww"[x as any]!)
  }
  if (typeof base == "object" && "btw" in base && base.btw == "mrrp") {
    digits = digits.replace(/\d/g, (x) => "mmrrrrrrpp"[x as any]!)
  }

  loop: for (let i = 0; i < digits.length; i++) {
    const digit = digits[i]!
    switch (digit) {
      case "∞":
        new SymInfinity().insertAt(cursor, L)
        break
      case "-":
        new OpMinus().insertAt(cursor, L)
        break
      case ".":
        new CmdDot().insertAt(cursor, L)
        break
      case "e": {
        if (digits[i + 1] != "+" && digits[i + 1] != "-") {
          new CmdNum(digit).insertAt(cursor, L)
          break
        }
        if (imag) {
          new CmdWord("i", "var", true).insertAt(cursor, L)
          imag = false
        }
        new OpTimes().insertAt(cursor, L)
        new CmdNum("1").insertAt(cursor, L)
        new CmdNum("0").insertAt(cursor, L)
        const sup = new Block(null)
        new CmdSupSub(null, sup).insertAt(cursor, L)
        {
          const cursor = sup.cursor(R)
          for (i++; i < digits.length; i++) {
            const digit = digits[i]!
            if (digit == "-") {
              new OpMinus().insertAt(cursor, L)
            } else if (digit != "+") {
              new CmdNum(digit).insertAt(cursor, L)
            }
          }
        }
        break loop
      }
      default:
        new CmdNum(digit).insertAt(cursor, L)
    }
  }

  if (imag) {
    new CmdWord("i", "var", true).insertAt(cursor, L)
  }
}

function displayNum(
  cursor: Cursor,
  num: SReal,
  base: SReal,
  forceSign?: boolean,
  i?: boolean,
) {
  if (num.type == "approx") {
    if (forceSign && num.value >= 0) {
      new OpPlus().insertAt(cursor, L)
    }
    let val = numToBase(num.value, base)
    if (val == "Infinity") val = "∞"
    else if (val == "-Infinity") val = "-∞"
    else if (val == "NaN") val = "NaN"
    else if (val.indexOf(".") == -1) val += ".0"
    displayDigits(cursor, val, base, i)
  } else if (num.d == 1) {
    if (forceSign && num.n >= 0) {
      new OpPlus().insertAt(cursor, L)
    }
    displayDigits(cursor, numToBase(num.n, base), base, i)
  } else {
    if (forceSign && num.n >= 0) {
      new OpPlus().insertAt(cursor, L)
    }
    const n = new Block(null)
    const d = new Block(null)
    if (num.n < 0) {
      new OpMinus().insertAt(cursor, L)
    }
    new CmdFrac(n, d).insertAt(cursor, L)
    displayDigits(
      n.cursor(R),
      numToBase(num.n < 0 ? -num.n : num.n, base),
      base,
      i,
    )
    displayDigits(d.cursor(R), numToBase(num.d, base), base, undefined)
  }
}

function isZero(x: number | SReal | SPoint): boolean {
  if (typeof x == "number") {
    return x == 0
  }

  switch (x.type) {
    case "approx":
      return x.value == 0
    case "exact":
      return x.n == 0 && x.d != 0
    case "point":
      return isZero(x.x) && isZero(x.y)
  }
}

function displayComplex(cursor: Cursor, num: SPoint, base: SReal) {
  const showX = !isZero(num.x)
  if (showX) displayNum(cursor, num.x, base)
  displayNum(cursor, num.y, base, showX, true)
}

function canWriteBase(baseRaw: SReal): boolean {
  const base =
    typeof baseRaw == "number" ? baseRaw
    : baseRaw.type == "approx" ? baseRaw.value
    : baseRaw.type == "exact" && baseRaw.d == 1 ? baseRaw.n
    : null

  if (base == null || !safe(base) || base <= 1 || base > 36) {
    return false
  }

  return true
}

function numToBase(value: number, baseRaw: SReal): string {
  const base =
    typeof baseRaw == "number" ? baseRaw
    : baseRaw.type == "approx" ? baseRaw.value
    : baseRaw.type == "exact" && baseRaw.d == 1 ? baseRaw.n
    : null

  if (base == null || !safe(base) || base <= 1 || base > 36) {
    return value.toString(10)
  }

  return value.toString(base)
}

function displayList<T>(
  cursor: Cursor,
  data: T[],
  base: SReal,
  display: (cursor: Cursor, value: T, base: SReal) => void,
) {
  const block = new Block(null)
  {
    const cursor = block.cursor(R)
    for (let i = 0; i < data.length; i++) {
      if (i != 0) {
        new CmdComma().insertAt(cursor, L)
      }
      display(cursor, data[i]!, base)
    }
  }
  new CmdBrack("[", "]", null, block).insertAt(cursor, L)
}

function realIsApprox(real: SReal) {
  return real.type == "approx"
}

function valIsApprox(val: JsVal): boolean {
  switch (val.type) {
    case "r32":
    case "r64":
      return realIsApprox(val.value as SReal)
    case "c32":
    case "c64":
    case "point32":
    case "point64":
      return (
        realIsApprox((val.value as SPoint).x) ||
        realIsApprox((val.value as SPoint).y)
      )
    case "color":
      return (
        realIsApprox((val.value as SColor).r) ||
        realIsApprox((val.value as SColor).g) ||
        realIsApprox((val.value as SColor).b)
      )
    case "bool":
      return false
  }
}

function isApproximate(value: JsValue): boolean {
  return value.list !== false ?
      value.value.some((val) =>
        valIsApprox({ type: value.type, value: val } as any),
      )
    : valIsApprox(value)
}

function displayValue<T>(
  cursor: Cursor,
  value: { list: number; value: T[] } | { list: false; value: T },
  base: SReal,
  fn: (cursor: Cursor, num: T, base: SReal) => void,
) {
  if (value.list !== false) {
    displayList(cursor, value.value, base, fn)
  } else {
    fn(cursor, value.value, base)
  }
}

export function display(field: FieldInert, value: JsValue, base: SReal) {
  field.block.clear()
  const cursor = field.block.cursor(R)

  if (isApproximate(value)) {
    new OpApprox(false).insertAt(cursor, L)
  } else {
    new OpEq(false).insertAt(cursor, L)
  }

  switch (value.type) {
    case "r32":
    case "r64":
      displayValue(cursor, value as JsValue<"r32" | "r64">, base, displayNum)
      break
    case "c32":
    case "c64":
      displayValue(
        cursor,
        value as JsValue<"c32" | "c64">,
        base,
        displayComplex,
      )
      break
    case "point32":
    case "point64":
      displayValue(
        cursor,
        value as JsValue<"point32" | "point64">,
        base,
        (cursor, num, base) => {
          const block = new Block(null)
          new CmdBrack("(", ")", null, block).insertAt(cursor, L)
          const inner = block.cursor(R)
          displayNum(inner, num.x, base)
          new CmdComma().insertAt(inner, L)
          displayNum(inner, num.y, base, false, false)
        },
      )
      break
    case "bool":
      displayValue(cursor, value as JsValue<"bool">, base, (cursor, value) => {
        new CmdWord(value + "", "var").insertAt(cursor, L)
      })
      break
    case "color":
      displayValue(cursor, value as JsValue<"color">, base, (cursor, value) => {
        const f = (x: SReal) => {
          const v = Math.min(255, Math.max(0, Math.floor(num(x)))).toString(16)
          if (v.length == 1) return "0" + v
          return v
        }

        new CmdColor("#" + f(value.r) + f(value.g) + f(value.b)).insertAt(
          cursor,
          L,
        )
      })
      break
  }

  if (canWriteBase(base) && num(base) != 10) {
    new CmdWord("base", "infix").insertAt(cursor, L)
    displayNum(cursor, base, frac(10, 1))
  }
}
