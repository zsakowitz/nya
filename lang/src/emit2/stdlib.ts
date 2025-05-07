import { KFalse, KTrue, TFloat, TInt, TSym } from "../ast/kind"
import { Declarations } from "./decl"
import { globalIdent as g, Id } from "./id"
import type { EmitProps } from "./props"
import { Fn, Scalar } from "./type"
import { Value } from "./value"

export function createStdlib(props: EmitProps) {
  const lang = props.lang

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

  const decl = new Declarations(
    props,
    null,
    void_,
    (literal) => {
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
    },
    (value) => {
      if (
        value.type == num &&
        typeof value.value == "number" &&
        Number.isSafeInteger(value.value)
      ) {
        return value.value
      }
      return null
    },
  )

  for (const v of [num, bool]) {
    decl.types.set(g(v.name), v)
  }

  const lnum = { name: "lhs", type: num }
  const rnum = { name: "rhs", type: num }
  const xnum = { name: "x", type: num }
  const ynum = { name: "y", type: num }

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

  function numMathOp(name: string) {
    const op = Math[name as keyof typeof Math] as (x: number) => number
    const id = new Id(name).ident()
    return new Fn(g(name), [xnum], num, ([a]) => {
      if (a!.const()) {
        return new Value(op(a.value as number), num)
      }
      if (props.lang == "glsl") {
        return new Value(`${name}(${a})`, num)
      }
      decl.global(`const ${id}=Math.${name};`)
      return new Value(`${id}(${a})`, num)
    })
  }

  const atanId = new Id("Math.atan2").ident()
  const logId = new Id("Math.log").ident()
  const hypotId = new Id("Math.hypot").ident()

  const fns: Fn[] = [
    // Something which isn't constant for testing purposes
    new Fn(g("x"), [], num, () => new Value("pos.x", num)),
    new Fn(g("y"), [], num, () => new Value("pos.y", num)),

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

    // The easy numeric functions
    ..."sin cos tan asin acos atan sinh cosh tanh asinh acosh atanh exp abs cbrt sqrt ceil floor round sign log10"
      .split(" ")
      .map(numMathOp),

    // The hard numeric functions
    new Fn(g("atan"), [ynum, xnum], num, ([y, x]) => {
      if (y!.const() && x!.const()) {
        return new Value(Math.atan2(y.value as number, x.value as number), num)
      }
      if (props.lang != "glsl") {
        decl.global(`const ${atanId}=Math.atan2;`)
      }
      return new Value(
        props.lang == "glsl" ? `atan2(${y!},${x!})` : `${atanId}(${y!},${x!})`,
        num,
      )
    }),

    // TODO: ln hypot ~=
    // TODO: inf nan pi e epsilon
    // TODO: is_inf is_nan is_finite
    // TODO: && || == != !
  ]

  for (const f of fns) {
    decl.fns.push(f.id, f)
  }

  return decl
}
