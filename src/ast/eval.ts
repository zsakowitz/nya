import { OpEq, OpTilde } from "../field/cmd/leaf/cmp"
import { CmdDot } from "../field/cmd/leaf/dot"
import { CmdNum } from "../field/cmd/leaf/num"
import { OpMinus, OpPlus } from "../field/cmd/leaf/op"
import { CmdWord } from "../field/cmd/leaf/word"
import { CmdFrac } from "../field/cmd/math/frac"
import type { FieldInert } from "../field/field-inert"
import { Block, L, R, type Cursor } from "../field/model"
import type { Node, PuncBinary, PuncUnary } from "./token"

/** An approximate value, rounded by the errors of computers. */
export interface LApprox {
  readonly type: "approx"
  readonly value: number
}

/** An approximate value, rounded by the errors of computers. */
export interface LExact {
  readonly type: "exact"
  readonly n: number
  readonly d: number
}

/** A number. Possibly an exact fraction. */
export type LNumber = LApprox | LExact

/** A point. Possibly with exact coordinates. */
export interface LPoint {
  readonly type: "point"
  readonly x: LNumber
  readonly y: LNumber
}

/** A single value returned from the evaluator. */
export type Single =
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

export function isSafeInteger(value: number) {
  return value == Math.floor(value) && Math.abs(value) < 0x20000000000000 // 2 ** 53
}

export function num(x: number | LNumber): LNumber {
  if (typeof x == "number") {
    if (isSafeInteger(x)) {
      return { type: "exact", n: x, d: 1 }
    } else {
      return { type: "approx", value: x }
    }
  } else {
    return x
  }
}

export function pt(x: number | LNumber, y: number | LNumber): LPoint {
  return {
    type: "point",
    x: num(x),
    y: num(y),
  }
}

export function aspt(z: number | LNumber | LPoint): LPoint {
  if (typeof z == "object" && z.type == "point") return z
  return pt(z, 0)
}

export function split(approx: (a: number, b: number) => number | Single) {
  return (a: Single, b: Single): Single => {
    if (a.type == "number" && b.type == "number") {
      return single(
        approx(
          a.value.type == "approx" ? a.value.value : a.value.n / a.value.d,
          b.value.type == "approx" ? b.value.value : b.value.n / b.value.d,
        ),
      )
    }
    throw new Error("Cannot compute anything involving complex numbers yet.")
  }
}

export function split1(approx: (a: number) => number | Single) {
  return (a: Single): Single => {
    if (a.type == "number") {
      return single(
        approx(
          a.value.type == "approx" ? a.value.value : a.value.n / a.value.d,
        ),
      )
    }
    throw new Error("Cannot compute anything involving complex numbers yet.")
  }
}

export function single(value: number | Single): Single {
  if (typeof value == "number") {
    return { type: "number", value: num(value) }
  } else {
    return value
  }
}

export function coerce(values: Single[]): Value {
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
        x.value.type == "point" ? x.value : pt(x.value, 1),
      ),
    }
  }
}

export function distribute(
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

export function distribute1(a: Value, go: (a: Single) => Single): Value {
  if (a.list) {
    return coerce(a.value.map((ai) => go({ type: a.type, value: ai } as any)))
  } else {
    return { ...go(a), list: false }
  }
}

/** Props passed to the evaluator. */
export interface EvalProps {
  /** Changed by the `base` operator. */
  currentBase: number | LNumber | LPoint

  /** Changed by variables, the `with` operator, and the `for` operator. */
  bindings: Record<string, Value>
}

/** Default props passed to the evaluator. */
export const defaultProps: EvalProps = {
  currentBase: 10,
  bindings: Object.create(null),
}

function parseNumber(text: string, base: number | LNumber | LPoint) {
  if (base == 10) return +text

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

  if (
    numericValue &&
    isSafeInteger(numericValue) &&
    2 <= numericValue &&
    numericValue <= 36 &&
    text.indexOf(".") == -1
  ) {
    return parseInt(text, numericValue)
  }

  throw new Error(
    "Bases other than 2-36 or on non-integers are not implemented yet.",
  )
}

export function evalBinary(
  op: PuncBinary,
  an: Node,
  bn: Node,
  props: EvalProps,
): Value {
  const a = () => go(an, props)
  const b = () => go(bn, props)

  switch (op) {
    case "\u00F7":
      return distribute(
        a(),
        b(),
        split((a, b) => a / b),
      )
    case "+":
      return distribute(
        a(),
        b(),
        split((a, b) => a + b),
      )
    case "-":
      return distribute(
        a(),
        b(),
        split((a, b) => a - b),
      )
    case "\\cdot ":
      return distribute(
        a(),
        b(),
        split((a, b) => a * b),
      )
    case "mod":
      return distribute(
        a(),
        b(),
        split((a, b) => ((a % b) + b) % b),
      )
    case "base": {
      const base = go(bn, { ...props, currentBase: 10 })
      if (base.list) {
        throw new Error("Cannot use a list as a base yet.")
      }
      return go(an, { ...props, currentBase: base.value })
    }
    case "for":
    case "with":
    case "\\and ":
    case "\\or ":
    case "..":
    case "...":
    case "\\pm ":
    case "\\mp ":
    case "\\to ":
    case "\\Rightarrow ":
    case ".":
    case ",":
    case "\\uparrow ":
    default:
      throw new Error(
        `Cannot evaluate binary operator '${typeof op == "string" ? op : op.dir}' yet.`,
      )
  }
}

export function evalUnary(op: PuncUnary, a: Value, props: EvalProps): Value {
  switch (op) {
    case "\\neg ":
    case "+":
    case "-":
    case "\\pm ":
    case "\\mp ":
    case "!":
    default:
      throw new Error(`Cannot evaluate unary operator '${op}' yet.`)
  }
}

/** Evaluates a node. */
export function go(token: Node, props: EvalProps): Value {
  switch (token.type) {
    case "num":
      if (token.sub) {
        return evalBinary(
          "base",
          { type: "num", value: token.value },
          token.sub,
          props,
        )
      }
      return {
        type: "number",
        list: false,
        value: num(parseNumber(token.value, props.currentBase)),
      }
    case "frac":
      return evalBinary("÷", token.a, token.b, props)
    case "root":
      if (token.root) {
        return distribute(
          go(token.contents, props),
          go(token.root, props),
          split((a, b) => Math.pow(a, 1 / b)),
        )
      } else {
        return distribute1(
          go(token.contents, props),
          split1((a) => Math.sqrt(a)),
        )
      }
    case "op":
      if (token.b) {
        return evalBinary(token.kind, token.a, token.b, props)
      } else {
        return evalUnary(token.kind, go(token.a, props), props)
      }
    case "error":
      throw new Error(token.reason)
    case "group":
      if (token.lhs == "(" && token.rhs == ")") {
        return go(token.value, props)
      }
    case "factorial":
    case "raise":
    case "void":
    case "var":
    case "num16":
    case "sub":
    case "sup":
    case "call":
    case "for":
    case "piecewise":
    case "matrix":
    case "bigsym":
    case "big":
    case "index":
    case "juxtaposed":
    case "commalist":
    case "punc":
      throw new Error(`The '${token.type}' node type is not implemented yet.`)
  }
}

export function displayDigits(cursor: Cursor, digits: string) {
  for (const digit of digits) {
    switch (digit) {
      case "-":
        new OpMinus().insertAt(cursor, L)
        break
      case ".":
        new CmdDot().insertAt(cursor, L)
        break
      default:
        new CmdNum(digit).insertAt(cursor, L)
    }
  }
}

export function displayNum(cursor: Cursor, num: LNumber, i?: boolean) {
  if (num.type == "approx") {
    if (i && num.value >= 0) {
      new OpPlus().insertAt(cursor, L)
    }
    new OpTilde(false).insertAt(cursor, L)
    displayDigits(cursor, num.value + "")
  } else if (num.d == 1) {
    if (i && num.n >= 0) {
      new OpPlus().insertAt(cursor, L)
    }
    displayDigits(cursor, num.n + "")
  } else {
    if (i && num.n >= 0) {
      new OpPlus().insertAt(cursor, L)
    }
    const n = new Block(null)
    const d = new Block(null)
    if (num.n < 0) {
      new OpMinus().insertAt(cursor, L)
    }
    new CmdFrac(n, d).insertAt(cursor, L)
    displayDigits(n.cursor(R), (num.n < 0 ? -num.n : num.n) + "")
    if (i) {
      new CmdWord("i", "var", true).insertAt(n.cursor(R), L)
      i = false
    }
    displayDigits(d.cursor(R), num.d + "")
  }
  if (i) {
    new CmdWord("i", "var", true).insertAt(cursor, L)
  }
}

export function displayComplex(cursor: Cursor, num: LPoint) {
  displayNum(cursor, num.x)
  displayNum(cursor, num.y, true)
}

export function display(field: FieldInert, value: Value) {
  field.block.clear()
  const cursor = field.block.cursor(R)
  new OpEq(false).insertAt(cursor, L)
  if (value.type == "number") {
    if (value.list) {
      // return "[" + value.value.map(displayNum).join(", ") + "]"
    } else {
      displayNum(cursor, value.value)
    }
  } else {
    if (value.list) {
      // return "[" + value.value.map(displayComplex).join(", ") + "]"
    } else {
      displayComplex(cursor, value.value)
    }
  }
}
