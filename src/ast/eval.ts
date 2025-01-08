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
import { Block, L, R, type Cursor } from "../field/model"
import type { Node, PuncBinary, PuncUnary } from "./token"

const ZERO = toNum(0)

/** An approximate value, rounded by the errors of computers. */
interface LApprox {
  readonly type: "approx"
  readonly value: number
}

/** An exact fraction, with the numerator and denominator reduced. */
interface LExact {
  readonly type: "exact"
  readonly n: number
  readonly d: number
}

/** A number. Possibly an exact fraction. */
type LNumber = LApprox | LExact

/** A point. Possibly with exact coordinates. */
interface LPoint {
  readonly type: "point"
  readonly x: LNumber
  readonly y: LNumber
}

/** A single value returned from the evaluator. */
type Single =
  | { type: "number"; value: LNumber }
  | { type: "complex"; value: LPoint }

/** A single or list value returned from the evaluator. */
export type Value =
  Single extends infer T ?
    T extends { value: unknown } ?
      | (T & { list: false })
      | (Omit<T, "value"> & { list: true; value: T["value"][] })
    : never
  : never

function safe(value: number) {
  return value == Math.floor(value) && Math.abs(value) < 0x20000000000000 // 2 ** 53
}

function toNum(x: number): LNumber {
  if (typeof x == "number") {
    if (safe(x)) {
      return { type: "exact", n: x, d: 1 }
    } else {
      return { type: "approx", value: x }
    }
  } else {
    return x
  }
}

function pt(x: LNumber, y: LNumber): LPoint {
  return { type: "point", x, y }
}

function split(approx: (a: number, b: number) => Single) {
  return (a: Single, b: Single): Single => {
    if (a.type == "number" && b.type == "number") {
      return approx(
        a.value.type == "approx" ? a.value.value : a.value.n / a.value.d,
        b.value.type == "approx" ? b.value.value : b.value.n / b.value.d,
      )
    }
    throw new Error("The `mod` function does not work on complex numbers.")
  }
}

function coerce(values: Single[]): Value {
  if (values.every((x) => x.type == "number")) {
    return {
      type: "number",
      list: true,
      value: values.map((x) => x.value),
    }
  } else {
    return {
      type: "complex",
      list: true,
      value: values.map((x) =>
        x.value.type == "point" ? x.value : pt(x.value, toNum(1)),
      ),
    }
  }
}

function distribute(
  a: Value,
  b: Value,
  go: (a: Single, b: Single) => Single,
): Value {
  if (a.list) {
    if (b.list) {
      return coerce(
        Array.from(
          { length: Math.min(a.value.length, b.value.length) },
          (_, i) =>
            go(
              { type: a.type, value: a.value[i]! } as any,
              { type: b.type, value: b.value[i]! } as any,
            ),
        ),
      )
    } else {
      return coerce(
        a.value.map((ai) => go({ type: a.type, value: ai } as any, b)),
      )
    }
  } else {
    if (b.list) {
      return coerce(
        b.value.map((bi) => go(a, { type: b.type, value: bi } as any)),
      )
    } else {
      return { ...go(a, b), list: false }
    }
  }
}

function distribute1(a: Value, go: (a: Single) => Single): Value {
  if (a.list) {
    return coerce(a.value.map((ai) => go({ type: a.type, value: ai } as any)))
  } else {
    return { ...go(a), list: false }
  }
}

function zip<T>(a: Value, b: T[], go: (a: Single, b: T) => Single): Value {
  if (a.list) {
    return coerce(
      Array.from({ length: Math.min(a.value.length, b.length) }, (_, i) =>
        go({ type: a.type, value: a.value[i]! } as any, b[i]!),
      ),
    )
  } else {
    return coerce(b.map((bi) => go(a, bi)))
  }
}

/** Props passed to the evaluator. */
export interface EvalProps {
  /** Changed by the `base` operator. */
  currentBase: Base

  /** Changed by variables, the `with` operator, and the `for` operator. */
  bindings: Record<string, Value>
}

function num(n: LNumber): number {
  return n.type == "approx" ? n.value : n.n / n.d
}

function approx(value: number): LApprox {
  return { type: "approx", value }
}

function point(n: Single): LPoint {
  return n.type == "number" ? pt(n.value, ZERO) : n.value
}

function op1(
  getApprox: (a: number, ar: LNumber) => LNumber,
  getPoint: (n: (a: LNumber) => LNumber, a: LPoint) => LPoint,
  getExact: (a: LExact) => LNumber | null = (a) => getApprox(a.n / a.d, a),
) {
  function n(a: LNumber): LNumber {
    if (a.type == "exact") {
      const val = getExact(a)
      if (val != null) return val
    }

    return getApprox(num(a), a)
  }

  function p(a: LPoint): LPoint {
    return getPoint(n, a)
  }

  function s(a: Single): Single {
    if (a.type == "number") {
      return { type: "number", value: n(a.value) }
    } else {
      return { type: "complex", value: p(point(a)) }
    }
  }

  return {
    x: getExact,
    n,
    p,
    s,
    v(a: Value): Value {
      return distribute1(a, s)
    },
  }
}

function op2(
  getApprox: (a: number, b: number, ar: LNumber, br: LNumber) => LNumber,
  getPoint: (
    n: (a: LNumber, b: LNumber) => LNumber,
    a: LPoint,
    b: LPoint,
  ) => LPoint,
  getExact: (a: LExact, b: LExact) => LNumber | null = (a, b) =>
    getApprox(a.n / a.d, b.n / b.d, a, b),
) {
  function n(a: LNumber, b: LNumber): LNumber {
    if (a.type == "exact" && b.type == "exact") {
      const val = getExact(a, b)
      if (val != null) return val
    }

    return getApprox(num(a), num(b), a, b)
  }

  function p(a: LPoint, b: LPoint): LPoint {
    return getPoint(n, a, b)
  }

  function s(a: Single, b: Single): Single {
    if (a.type == "number" && b.type == "number") {
      return { type: "number", value: n(a.value, b.value) }
    } else {
      return { type: "complex", value: p(point(a), point(b)) }
    }
  }

  return {
    x: getExact,
    n,
    p,
    s,
    v(a: Value, b: Value): Value {
      return distribute(a, b, s)
    },
  }
}

const add = op2(
  (a, b) => approx(a + b),
  (n, a, b) => {
    return pt(n(a.x, b.x), n(a.y, b.y))
  },
  (a, b) => {
    const s1 = a.n * b.d
    if (!safe(s1)) return null
    const s2 = b.n * a.d
    if (!safe(s2)) return null
    const s3 = a.d * b.d
    if (!safe(s3)) return null
    const s4 = s1 + s2
    if (!safe(s4)) return null
    return frac(s4, s3)
  },
)

const sub = op2(
  (a, b) => approx(a - b),
  (n, a, b) => {
    return pt(n(a.x, b.x), n(a.y, b.y))
  },
  (a, b) => {
    const s1 = a.n * b.d
    if (!safe(s1)) return null
    const s2 = b.n * a.d
    if (!safe(s2)) return null
    const s3 = a.d * b.d
    if (!safe(s3)) return null
    const s4 = s1 - s2
    if (!safe(s4)) return null
    return frac(s4, s3)
  },
)

const mul = op2(
  (_, _0, a, b) => {
    if ((a.type == "exact" && a.n == 0) || (b.type == "exact" && b.n == 0)) {
      return frac(0, 1)
    }
    return approx(num(a) * num(b))
  },
  (n, { x: a, y: b }, { x: c, y: d }) => {
    //   (a+bi)(c+di)
    // = ac-bd + i(bc+ad)
    return pt(sub.n(n(a, c), n(b, d)), add.n(n(b, c), n(a, d)))
  },
  (a, b) => {
    const s1 = a.n * b.n
    if (!safe(s1)) return null
    const s2 = a.d * b.d
    if (!safe(s2)) return null
    return frac(s1, s2)
  },
)

const odot = op2(
  (_, _0, a, b) => mul.n(a, b),
  (n, { x: a, y: b }, { x: c, y: d }) => pt(n(a, c), n(b, d)),
  mul.x,
)

const div = op2(
  (_, _0, a, b) => {
    if (a.type == "exact" && a.n == 0) {
      return frac(0, 1)
    }
    return approx(num(a) / num(b))
  },
  (n, { x: a, y: b }, { x: c, y: d }) => {
    //   (a+bi) / (c+di)
    // = (a+bi)(c-di) / (c+di)(c-di)
    // = (a+bi)(c-di) / (c²-d²i²)
    // = (a+bi)(c-di) / (c²+d²)
    const x = add.n(mul.n(a, c), mul.n(b, d))
    const y = sub.n(mul.n(b, c), mul.n(a, d))
    const denom = add.n(mul.n(c, c), mul.n(d, d))
    return pt(n(x, denom), n(y, denom))
  },
  (a, b) => {
    const s1 = (a.n / gcd(a.n, b.d)) * b.d
    if (!safe(s1)) return null
    const s2 = (b.n / gcd(b.n, a.d)) * a.d
    if (!safe(s2)) return null
    return frac(s1, s2)
  },
)

const hypot =
  (Math as any).hypot ?? ((x: number, y: number) => Math.sqrt(x * x + y * y))

const exp = op1(
  (a) => approx(Math.E ** a),
  (n, a) => {
    const e = n(a.x)

    return pt(
      mul.n(e, approx(Math.cos(num(a.y)))),
      mul.n(e, approx(Math.sin(num(a.y)))),
    )
  },
)

const pow = op2(
  (a, b) => approx(a ** b),
  (n, a, b) => {
    if (isZero(a)) {
      if (a.x.type == "exact" && b.x.type == "exact") {
        return pt(ZERO, ZERO)
      } else {
        return pt(approx(0), approx(0))
      }
    }

    return exp.p(
      mul.p(b, {
        type: "point",
        x: approx(Math.log(hypot(num(a.x), num(a.y)))),
        y: approx(Math.atan2(num(a.y), num(a.x))),
      }),
    )
  },
)

/** Default props passed to the evaluator. */
export const defaultProps: EvalProps = {
  currentBase: 10,
  bindings: Object.create(null),
}

function gcd(a: number, b: number) {
  for (let temp = b; b !== 0; ) {
    b = a % b
    a = temp
    temp = b
  }
  return a
}

function frac(a: number, b: number): LNumber {
  if (b == 0) return { type: "approx", value: a / b }
  if (a == 0) return { type: "exact", n: 0, d: 1 }
  if (b < 0) {
    a = -a
    b = -b
  }
  const divBy = gcd(a < 0 ? -a : a, b)
  return { type: "exact", n: a / divBy, d: b / divBy }
}

function parseNumber(text: string, base: number | LNumber | LPoint): LNumber {
  const numericValue =
    typeof base == "number" ? base
    : base.type == "approx" ? base.value
    : base.type == "exact" ? base.n / base.d
    : (
      base.y.type == "approx" ?
        base.y.value == 0
      : base.y.n == 0 && base.y.d != 0
    ) ?
      base.x.type == "approx" ?
        base.x.value
      : base.x.n / base.x.d
    : null

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
    return toNum(int)
  }

  throw new Error(
    "Bases other than 2-36 and evaluating a non-integer in a particular base are not suppported yet.",
  )
}

function evalBinary(
  op: PuncBinary,
  an: Node,
  bn: Node,
  props: EvalProps,
): Value {
  const a = () => go(an, props)
  const b = () => go(bn, props)

  switch (op) {
    case "+":
      return add.v(a(), b())
    case "-":
      return sub.v(a(), b())
    case "juxtaposition":
    case "\\cdot ":
    case "\\times ":
      return mul.v(a(), b())
    case "\\odot ":
      return odot.v(a(), b())
    case "÷":
      return div.v(a(), b())
    case "mod":
      return distribute(
        a(),
        b(),
        split((a, b) => ({ type: "number", value: approx(((a % b) + b) % b) })),
      )
    case "base": {
      const base: Value =
        (
          bn.type == "var" &&
          bn.kind == "var" &&
          (bn.value == "mrrp" || bn.value == "meow")
        ) ?
          {
            type: "number",
            list: false,
            value: { type: "exact", n: 10, d: 1, ...{ btw: bn.value } },
          }
        : go(bn, { ...props, currentBase: 10 })

      if (base.list) {
        throw new Error("Cannot use a list as a base yet.")
      }
      return go(an, { ...props, currentBase: base.value })
    }
    case "\\pm ":
      return add.v(
        a(),
        zip(b(), [identity, neg], (a, b) => b(a)),
      )
    case "\\mp ":
      return add.v(
        a(),
        zip(b(), [neg, identity], (a, b) => b(a)),
      )
    case "\\uparrow ":
      return pow.v(a(), b())
    case "for":
    case "with":
    case "\\and ":
    case "\\or ":
    case "..":
    case "...":
    case "\\to ":
    case "\\Rightarrow ":
    case ".":
    case ",":
    default:
      throw new Error(
        `Cannot evaluate binary operator '${typeof op == "string" ? op : op.dir}' yet.`,
      )
  }
}

function nneg(x: LNumber): LNumber {
  return x.type == "approx" ?
      { type: "approx", value: -x.value }
    : { type: "exact", n: -x.n, d: x.d }
}

function identity<T>(x: T) {
  return x
}

function neg(x: Single): Single {
  return x.type == "number" ?
      { type: "number", value: nneg(x.value) }
    : {
        type: "complex",
        value: { type: "point", x: nneg(x.value.x), y: nneg(x.value.y) },
      }
}

function evalUnary(op: PuncUnary, an: Node, props: EvalProps): Value {
  const a = go(an, props)

  switch (op) {
    case "+":
      return a
    case "-":
      return distribute1(a, neg)
    case "\\pm ":
      return zip(a, [identity, neg], (a, b) => b(a))
    case "\\mp ":
      return zip(a, [neg, identity], (a, b) => b(a))
    case "\\neg ":
    case "!":
    default:
      throw new Error(`Cannot evaluate unary operator '${op}' yet.`)
  }
}

/**
 * If the passed node is a `commalist`, returns all of its nodes. If it is a
 * `void`, returns an empty list. Otherwise, returns a list of the single passed
 * node.
 */
function list(node: Node): Node[] {
  if (node.type == "commalist") {
    return node.items
  }

  if (node.type == "void") {
    return []
  }

  return [node]
}

const PI: Value = { type: "number", list: false, value: approx(Math.PI) }
const TAU: Value = { type: "number", list: false, value: approx(2 * Math.PI) }
const E: Value = { type: "number", list: false, value: approx(Math.E) }
const I: Value = {
  type: "complex",
  list: false,
  value: { type: "point", x: ZERO, y: toNum(1) },
}
const INFINITY: Value = { type: "number", list: false, value: approx(1 / 0) }

/** Evaluates a node. */
export function go(node: Node, props: EvalProps): Value {
  switch (node.type) {
    case "num":
      if (node.sub) {
        return evalBinary(
          "base",
          { type: "num", value: node.value },
          node.sub,
          props,
        )
      }
      return {
        type: "number",
        list: false,
        value: parseNumber(node.value, props.currentBase),
      }
    case "frac":
      return evalBinary("÷", node.a, node.b, props)
    case "root":
      if (node.root) {
        return pow.v(
          go(node.contents, props),
          div.v(
            { type: "number", list: false, value: frac(1, 0) },
            go(node.root, props),
          ),
        )
      } else {
        return pow.v(go(node.contents, props), {
          type: "number",
          list: false,
          value: frac(1, 2),
        })
      }
    case "op":
      if (node.b) {
        return evalBinary(node.kind, node.a, node.b, props)
      } else {
        return evalUnary(node.kind, node.a, props)
      }
    case "error":
      throw new Error(node.reason)
    case "group":
      if (node.lhs == "(" && node.rhs == ")") {
        return go(node.value, props)
      }
      if (node.lhs == "[" && node.rhs == "]") {
        return coerce(
          list(node.value).map((x) => {
            const value = go(x, props)
            if (value.list == false) return value
            throw new Error("Cannot store a list inside a list.")
          }),
        )
      }
      break
    case "var": {
      const value: Value | null =
        node.sub ? null
        : node.value == "π" ? PI
        : node.value == "τ" ? TAU
        : node.value == "e" ? E
        : node.value == "i" ? I
        : node.value == "∞" ? INFINITY
        : null

      if (value) {
        if (node.sup) {
          return pow.v(value, go(node.sup, props))
        } else {
          return value
        }
      }

      break
    }
    case "juxtaposed":
      return evalBinary("juxtaposition", node.a, node.b, props)
    case "raise":
      return pow.v(go(node.base, props), go(node.exponent, props))
    case "call": {
      if (node.on) break
      return evalBinary(
        "juxtaposition",
        node.name,
        { type: "group", lhs: "(", rhs: ")", value: node.args },
        props,
      )
    }
    case "factorial":
    case "void":
    case "num16":
    case "sub":
    case "sup":
    case "for":
    case "piecewise":
    case "matrix":
    case "bigsym":
    case "big":
    case "index":
    case "commalist":
    case "punc":
  }
  throw new Error(`The '${node.type}' node type is not implemented yet.`)
}

/** A base which can represent input and output values. */
export type Base = number | LNumber | LPoint

/** Gets the base an expression should be displayed to the user in. */
export function getOutputBase(node: Node, props: EvalProps): Base {
  if (node.type == "op" && node.kind == "base" && node.b) {
    if (node.b.type == "var" && node.b.kind == "var") {
      if (node.b.value == "mrrp" || node.b.value == "meow") {
        return { type: "exact", n: 10, d: 1, ...{ btw: node.b.value } }
      }
    }
    const value = go(node.b, props)
    if (value.list) {
      throw new Error("Cannot represent numbers in a list of bases.")
    } else {
      return value.value
    }
  } else {
    return props.currentBase
  }
}

function displayDigits(
  cursor: Cursor,
  digits: string,
  base: Base,
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
    const sub = new Block(null)
    new CmdSupSub(sub, null).insertAt(cursor, L)
    new CmdNum(baseToStr(base)).insertAt(sub.cursor(R), L)
  }
}

function baseToStr(baseRaw: Base) {
  const base =
    typeof baseRaw == "number" ? baseRaw
    : baseRaw.type == "approx" ? baseRaw.value
    : baseRaw.type == "exact" && baseRaw.d == 1 ? baseRaw.n
    : error("Complex bases are not supported yet.")

  return base == 10 ? "" : base + ""
}

function displayNum(
  cursor: Cursor,
  num: LNumber,
  base: Base,
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

function isZero(x: number | LNumber | LPoint): boolean {
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

function displayComplex(cursor: Cursor, num: LPoint, base: Base) {
  const showX = !isZero(num.x)
  if (showX) displayNum(cursor, num.x, base)
  displayNum(cursor, num.y, base, showX, true, showX)
}

function error(reason: string): never {
  throw new Error(reason)
}

function numToBase(value: number, baseRaw: Base): string {
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
    throw new Error(`Base ${base} is not supported.`)
  }

  if (base > 36) {
    throw new Error(`Base ${base} is not supported yet.`)
  }

  return value.toString(base)
}

function displayList<T>(
  cursor: Cursor,
  data: T[],
  base: Base,
  display: (cursor: Cursor, value: T, base: Base) => void,
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

function isApproximate(value: Value): boolean {
  return value.list ?
      value.value.some(
        (value) =>
          value.type == "approx" ||
          (value.type == "point" &&
            (value.x.type == "approx" || value.y.type == "approx")),
      )
    : value.value.type == "approx" ||
        (value.value.type == "point" &&
          (value.value.x.type == "approx" || value.value.y.type == "approx"))
}

export function display(field: FieldInert, value: Value, base: Base) {
  field.block.clear()
  const cursor = field.block.cursor(R)

  if (isApproximate(value)) {
    new OpApprox(false).insertAt(cursor, L)
  } else {
    new OpEq(false).insertAt(cursor, L)
  }
  if (value.type == "number") {
    if (value.list) {
      displayList(cursor, value.value, base, displayNum)
    } else {
      displayNum(cursor, value.value, base)
    }
  } else {
    if (value.list) {
      displayList(cursor, value.value, base, displayComplex)
    } else {
      displayComplex(cursor, value.value, base)
    }
  }
}
