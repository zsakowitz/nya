import type { JsVal, JsValue, SReal } from "."
import { OpApprox, OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdDot } from "../../field/cmd/leaf/dot"
import { CmdNum } from "../../field/cmd/leaf/num"
import { OpMinus, OpPlus, OpTimes } from "../../field/cmd/leaf/op"
import { SymInfinity } from "../../field/cmd/leaf/sym"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdBrack } from "../../field/cmd/math/brack"
import { CmdFrac } from "../../field/cmd/math/frac"
import { CmdSupSub } from "../../field/cmd/math/supsub"
import type { FieldInert } from "../../field/field-inert"
import { Block, L, R, type Cursor } from "../../field/model"
import type { Node } from "../ast/token"
import { js, type PropsJs } from "../js"
import { safe } from "../lib/util"
import { isZero } from "./check"
import { isReal } from "./coerce"
import { frac, num, real } from "./create"
import { TY_INFO } from "./info"

export interface TyWrite<T> {
  display(value: T, props: Display): void
  isApprox(value: T): boolean
}

export class Display {
  constructor(
    readonly cursor: Cursor,
    private readonly base: SReal,
  ) {}

  protected odigits(digits: string, tag?: string) {
    const { base } = this

    if (typeof base == "object" && "btw" in base && base.btw == "meow") {
      digits = digits.replace(/\d/g, (x) => "mmrraaooww"[x as any]!)
    }
    if (typeof base == "object" && "btw" in base && base.btw == "mrrp") {
      digits = digits.replace(/\d/g, (x) => "mmrrrrrrpp"[x as any]!)
    }

    this.digits(digits, tag)
  }

  digits(digits: string, tag?: string) {
    const { cursor } = this

    loop: for (let i = 0; i < digits.length; i++) {
      const digit = digits[i]!
      switch (digit) {
        case "∞":
          new SymInfinity().insertAt(cursor, L)
          break
        case "+":
          new OpPlus().insertAt(cursor, L)
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
          if (tag) {
            new CmdWord(tag, "var", true).insertAt(cursor, L)
            tag = undefined
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

    if (tag) {
      new CmdWord(tag, "var", true).insertAt(cursor, L)
    }
  }

  protected canWriteBase() {
    const baseRaw = this.base

    const base =
      typeof baseRaw == "number" ? baseRaw
      : baseRaw.type == "approx" ? baseRaw.value
      : baseRaw.type == "exact" && baseRaw.d == 1 ? baseRaw.n
      : null

    return !(base == null || !safe(base) || base <= 1 || base > 36)
  }

  protected numToBase(value: number): string {
    const baseRaw = this.base

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

  at(cursor: Cursor): Display {
    return new Display(cursor, this.base)
  }

  value(num: number, signed = false, tag?: string) {
    let val = this.numToBase(num)
    if (signed && val[0] != "-") val = "+" + val
    if (val == "Infinity") val = "∞"
    else if (val == "+Infinity") val = "+∞"
    else if (val == "-Infinity") val = "-∞"
    this.odigits(val, tag)
  }

  values(nums: [number, string][]) {
    let wrote = false

    for (const [num, tag] of nums) {
      if (num != 0) {
        this.value(num, wrote, tag)
        wrote = true
      }
    }

    if (!wrote) {
      this.value(0)
    }
  }

  num(num: SReal, tag?: string, signed = false) {
    const { cursor } = this
    if (num.type == "approx") {
      let val = this.numToBase(num.value)
      if (signed && val[0] != "-") val = "+" + val
      if (val == "Infinity") val = "∞"
      else if (val == "-Infinity") val = "-∞"
      else if (val != "NaN" && val.indexOf(".") == -1) val += ".0"
      this.odigits(val, tag)
    } else if (num.d == 1) {
      let val = this.numToBase(num.n)
      if (signed && val[0] != "-") val = "+" + val
      if (tag && val == "+1") val = "+"
      else if (tag && val == "-1") val = "-"
      else if (tag && val == "1") val = ""
      this.odigits(val, tag)
    } else {
      const n = new Block(null)
      const d = new Block(null)
      if (num.n < 0) {
        new OpMinus().insertAt(cursor, L)
      } else if (signed) {
        new OpPlus().insertAt(cursor, L)
      }
      const frac = new CmdFrac(n, d)
      frac.insertAt(cursor, L)
      this.cursor.moveIn(n, R)
      let val = this.numToBase(num.n < 0 ? -num.n : num.n)
      this.odigits(val)
      this.cursor.moveIn(d, R)
      this.odigits(this.numToBase(num.d))
      this.cursor.moveTo(frac, R)
      if (tag) {
        new CmdWord(tag, undefined, true).insertAt(this.cursor, L)
      }
    }
  }

  nums(nums: [SReal, string][]) {
    let wrote = false

    for (const [num, tag] of nums) {
      if (!isZero(num)) {
        this.num(num, tag, wrote)
        wrote = true
      }
    }

    if (!wrote) {
      this.value(0)
    }
  }

  plainVal(val: JsVal) {
    TY_INFO[val.type].write.display(val.value as never, this)
  }

  plainValue(value: JsValue) {
    if (value.list === false) {
      this.plainVal(value)
    } else {
      const block = new Block(null)
      const brack = new CmdBrack("[", "]", null, block)
      brack.insertAt(this.cursor, L)
      this.cursor.moveIn(block, R)
      for (let i = 0; i < value.value.length; i++) {
        if (i != 0) {
          new CmdComma().insertAt(this.cursor, L)
        }
        TY_INFO[value.type].write.display(value.value[i] as never, this)
      }
      this.cursor.moveTo(brack, R)
    }
  }

  private isApprox(value: JsValue) {
    return value.list === false ?
        TY_INFO[value.type].write.isApprox(value.value as never)
      : value.value.some((x) => TY_INFO[value.type].write.isApprox(x as never))
  }

  output(value: JsValue, eqSign = true) {
    if (eqSign) {
      new (this.isApprox(value) ? OpApprox : OpEq)(false).insertAt(
        this.cursor,
        L,
      )
    }

    this.plainValue(value)

    if (this.canWriteBase() && num(this.base) != 10) {
      new CmdWord("base", "infix").insertAt(this.cursor, L)
      new Display(this.cursor, frac(10, 1)).num(this.base)
    }
  }
}

export function outputBase(node: Node, props: PropsJs): SReal {
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

export function display(field: FieldInert, value: JsValue, base: SReal) {
  field.block.clear()
  const cursor = field.block.cursor(R)
  new Display(cursor, base).output(value)
}
