import { OpApprox, OpEq } from "../field/cmd/leaf/cmp"
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
import type { JsVal, JsValue, SPoint, SReal } from "./ty"
import { num, real } from "./ty/create"
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
    if (value.list) {
      throw new Error("Cannot output in a list of bases yet.")
    }
    if (value.type != "real") {
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
  shouldWriteBase?: boolean,
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
        writeBase()
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

  writeBase()

  if (imag) {
    new CmdWord("i", "var", true).insertAt(cursor, L)
  }

  function writeBase() {
    if (!shouldWriteBase) return
    shouldWriteBase = false
    const str = baseToStr(base)
    if (str.length == 0) return
    const sub = new Block(null)
    new CmdSupSub(sub, null).insertAt(cursor, L)
    new CmdNum(str).insertAt(sub.cursor(R), L)
  }
}

function baseToStr(baseRaw: SReal) {
  const base = num(baseRaw)
  return base == 10 ? "" : base + ""
}

function displayNum(
  cursor: Cursor,
  num: SReal,
  base: SReal,
  forceSign?: boolean,
  i?: boolean,
  noBaseSubscript?: boolean,
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
    displayDigits(cursor, val, base, i, !noBaseSubscript)
  } else if (num.d == 1) {
    if (forceSign && num.n >= 0) {
      new OpPlus().insertAt(cursor, L)
    }
    displayDigits(cursor, numToBase(num.n, base), base, i, !noBaseSubscript)
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
    const num1 = num.n == 1 || num.n == -1
    displayDigits(
      n.cursor(R),
      numToBase(num.n < 0 ? -num.n : num.n, base),
      base,
      i,
      !(i && num1) ? !noBaseSubscript : undefined,
    )
    displayDigits(
      d.cursor(R),
      numToBase(num.d, base),
      base,
      undefined,
      i && num1 ? !noBaseSubscript : false,
    )
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
  displayNum(cursor, num.y, base, showX, true, showX)
}

function error(reason: string): never {
  throw new Error(reason)
}

function numToBase(value: number, baseRaw: SReal): string {
  const base =
    typeof baseRaw == "number" ? baseRaw
    : baseRaw.type == "approx" ? baseRaw.value
    : baseRaw.type == "exact" && baseRaw.d == 1 ? baseRaw.n
    : error("Complex bases are not supported yet.")

  if (!safe(base)) {
    throw new Error("Decimal bases are not supported yet.")
  }

  if (base <= -2) {
    throw new Error("Negative bases are not supported yet.")
  }

  if (base <= 1) {
    throw new Error(`SReal ${base} is not supported.`)
  }

  if (base > 36) {
    throw new Error(`SReal ${base} is not supported yet.`)
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

function valIsApprox(val: JsVal) {
  switch (val.type) {
    case "real":
      return realIsApprox(val.value)
    case "complex":
      return realIsApprox(val.value.x) || realIsApprox(val.value.y)
    case "color":
      return (
        realIsApprox(val.value.r) ||
        realIsApprox(val.value.g) ||
        realIsApprox(val.value.b)
      )
    case "bool":
      return false
  }
}

function isApproximate(value: JsValue): boolean {
  return value.list ?
      value.value.some((val) =>
        valIsApprox({ type: value.type, value: val } as any),
      )
    : valIsApprox(value)
}

function displayValue<T>(
  cursor: Cursor,
  value: { list: true; value: T[] } | { list: false; value: T },
  base: SReal,
  fn: (cursor: Cursor, num: T, base: SReal) => void,
) {
  if (value.list) {
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
    case "real":
      displayValue(cursor, value, base, displayNum)
      break
    case "complex":
      displayValue(cursor, value, base, displayComplex)
      break
    case "bool":
      displayValue(cursor, value, base, (cursor, value) => {
        new CmdWord(value + "", "var").insertAt(cursor, L)
      })
      break
    case "color":
  }
}
