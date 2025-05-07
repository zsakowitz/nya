import { KFalse, KTrue, TFloat, TInt, TSym } from "../ast/kind"
import { Declarations } from "./decl"
import { globalIdent as g } from "./id"
import type { Lang } from "./props"
import { Fn, Scalar } from "./type"
import { Value } from "./value"

export function createStdlib(lang: Lang) {
  const num = new Scalar(
    "num",
    lang == "glsl" ? "float" : "number",
    { type: "vec", count: 1, of: "float" },
    lang == "glsl" ?
      (v) => (v as number).toExponential()
    : (v) => "" + (v as number),
  )
  const bool = new Scalar(
    "bool",
    lang == "glsl" ? "bool" : "boolean",
    { type: "vec", count: 1, of: "bool" },
    (v) => "" + (v as boolean),
  )
  const sym = new Scalar(
    "sym",
    lang == "glsl" ? "uint" : "number",
    { type: "vec", count: 1, of: "uint" },
    (v) => "" + (v as number),
  )
  const void_ = new Scalar("void", "void", { type: "void" }, () => null)

  const decl = new Declarations(null, void_, (literal) => {
    switch (literal.value.kind) {
      case KTrue:
      case KFalse:
        return new Value(literal.value.val === "true", bool)

      case TFloat:
      case TInt:
        return new Value(+literal.value.val, num)

      case TSym:
        return new Value(g(literal.value.val).value, sym)
    }
  })

  for (const v of [num, bool]) {
    decl.types.set(g(v.name), v)
  }

  const lnum = { name: "lhs", type: num }
  const rnum = { name: "rhs", type: num }
  const xnum = { name: "x", type: num }

  function numBinOp(
    op: "+" | "-" | "*" | "/" | "<" | ">" | "==" | "!=" | "<=" | ">=",
    ret: Scalar,
    of: (a: number, b: number) => number | boolean,
  ) {
    return new Fn(g(op), [lnum, rnum], ret, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value(of(a.value as number, b.value as number), ret)
      }
      return new Value(`(${a})${op}(${b})`, num)
    })
  }

  const fns: Fn[] = [
    // The easy numeric operators
    numBinOp("+", num, (a, b) => a + b),
    numBinOp("-", num, (a, b) => a - b),
    numBinOp("*", num, (a, b) => a * b),
    numBinOp("/", num, (a, b) => a / b),
    numBinOp("<", bool, (a, b) => a < b),
    numBinOp(">", bool, (a, b) => a > b),
    numBinOp("<=", bool, (a, b) => a <= b),
    numBinOp(">=", bool, (a, b) => a >= b),
    numBinOp("==", bool, (a, b) => a == b),
    numBinOp("!=", bool, (a, b) => a != b),

    // The annoying numeric operators
    new Fn(g("-"), [xnum], num, ([a]) => {
      if (a!.const()) {
        return new Value(-(a.value as number), num)
      }
      return new Value(`-(${a})`, num)
    }),
    new Fn(g("**"), [lnum, rnum], num, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value((a.value as number) ** (b.value as number), num)
      }
      return new Value(
        lang == "glsl" ? `pow(${a},${b})` : `(${a})**(${b})`,
        num,
      )
    }),
    new Fn(g("%"), [lnum, rnum], num, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value((a.value as number) % (b.value as number), num)
      }
      return new Value(lang == "glsl" ? `mod(${a},${b})` : `(${a})%(${b})`, num)
    }),

    // TODO: sin cos tan asin acos atan sinh cosh tanh asinh acosh atanh
    // TODO: exp abs cbrt sqrt ceil floor round sign log10
    // TODO: atan2 ln hypot ~=
    // TODO: inf nan pi e epsilon
    // TODO: is_inf is_nan is_finite
    // TODO: && || == != !
  ]

  for (const f of fns) {
    decl.fns.push(f.id, f)
  }

  return decl
}
