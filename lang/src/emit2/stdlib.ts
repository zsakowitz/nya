import { KFalse, KTrue, TFloat, TInt, TSym } from "../ast/kind"
import {
  createBinaryBroadcastingFn,
  createUnaryBroadcastingFn,
} from "./broadcast"
import { Declarations } from "./decl"
import { ident as g, Id, type GlobalId } from "./id"
import type { EmitProps } from "./props"
import { Fn, Scalar } from "./type"
import { Value } from "./value"

export function createStdlib(props: EmitProps) {
  const lang = props.lang
  const epsilon = lang == "glsl" ? 1.1920928955078125e-7 : Number.EPSILON

  const num = new Scalar(
    "num",
    lang == "glsl" ? "float" : "number",
    { type: "vec", count: 1, of: "float" },
    (v) => {
      const name = (v as number).toString()
      if (name.includes(".") || name.includes("e")) {
        return name
      } else {
        return name + "."
      }
    },
    (v) => [v],
    (v) => v.pop()!,
  )
  const bool = new Scalar(
    "bool",
    lang == "glsl" ? "bool" : "boolean",
    { type: "vec", count: 1, of: "bool" },
    (v) => "" + (v as boolean),
    (v) => [v],
    (v) => v.pop()!,
  )
  const sym = new Scalar(
    "sym",
    lang == "glsl" ? "uint" : "number",
    { type: "vec", count: 1, of: "uint" },
    (v) => "" + (v as number),
    (v) => [v],
    (v) => v.pop()!,
  )
  const void_: Scalar = new Scalar(
    "void",
    "void",
    { type: "void" },
    () => null,
    () => [],
    () => new Value(0, void_),
  )

  const decl = new Declarations(
    props,
    null,
    void_,
    bool,
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
  const anum = { name: "a", type: num }
  const bnum = { name: "b", type: num }
  const xnum = { name: "x", type: num }
  const ynum = { name: "y", type: num }

  const lbool = { name: "lhs", type: bool }
  const rbool = { name: "rhs", type: bool }
  const xbool = { name: "x", type: bool }

  const bxl = { name: "lhs", type: "float" as const }
  const bxr = { name: "rhs", type: "float" as const }
  const bxx = { name: "x", type: "float" as const }

  function numBinOpArith(
    op: "+" | "-" | "*" | "/",
    of: (a: number, b: number) => number,
  ) {
    return [
      new Fn(g(op), [lnum, rnum], num, ([a, b]) => {
        if (a!.const() && b!.const()) {
          return new Value(of(a.value as number, b.value as number), num)
        }
        return new Value(`(${a})${op}(${b})`, num)
      }),
      createBinaryBroadcastingFn(props, g("@" + op), bxl, bxr, num, {
        glsl1: (a, b) => `(${a})${op}(${b})`,
        glslVec: (a, b) => `(${a})${op}(${b})`,
        js1: (a, b) => `(${a})${op}(${b})`,
        const: of as any,
      }),
    ]
  }

  function numBinOpBool(
    op: "<" | ">" | "==" | "!=" | "<=" | ">=",
    ret: Scalar,
    of: (a: number, b: number) => number | boolean,
  ) {
    return new Fn(g(op), [lnum, rnum], ret, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value(of(a.value as number, b.value as number), ret)
      }
      return new Value(`(${a})${op}(${b})`, ret)
    })
  }

  function boolBinOp(
    op: "&&" | "||" | "==" | "!=",
    of: (a: boolean, b: boolean) => boolean,
  ) {
    return new Fn(g(op), [lbool, rbool], bool, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value(of(a.value as boolean, b.value as boolean), bool)
      }
      return new Value(`(${a})${op}(${b})`, bool)
    })
  }

  function numMathOp(fnName: string, name = fnName) {
    const op = Math[name as keyof typeof Math] as (x: number) => number
    const id = new Id(fnName).ident()
    return new Fn(g(fnName), [xnum], num, ([a]) => {
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
  const hypotId = new Id("Math.hypot").ident()
  const absId = new Id("Math.abs").ident()
  const isFiniteId = new Id("glsl is_finite polyfill").ident()

  const fns: Fn[] = [
    // Non-constants for testing purposes
    new Fn(g("x"), [], num, () => new Value("pos.x", num)),
    new Fn(g("y"), [], num, () => new Value("pos.y", num)),

    // Easy numeric operators
    ...numBinOpArith("+", (a, b) => a + b),
    ...numBinOpArith("-", (a, b) => a - b),
    ...numBinOpArith("*", (a, b) => a * b),
    ...numBinOpArith("/", (a, b) => a / b),
    numBinOpBool("<", bool, (a, b) => a < b),
    numBinOpBool(">", bool, (a, b) => a > b),
    numBinOpBool("<=", bool, (a, b) => a <= b),
    numBinOpBool(">=", bool, (a, b) => a >= b),
    numBinOpBool("==", bool, (a, b) => a == b),
    numBinOpBool("!=", bool, (a, b) => a != b),

    // Annoying numeric operators
    new Fn(g("-"), [xnum], num, ([a]) => {
      if (a!.const()) {
        return new Value(-(a.value as number), num)
      }
      return new Value(`-(${a})`, num)
    }),
    createUnaryBroadcastingFn(props, g("@-"), bxx, num, {
      glsl1: (a) => `-(${a})`,
      glslVec: (a) => `-(${a})`,
      js1: (a) => `-(${a})`,
      const: (a) => -(a as number),
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

    // Easy numeric functions
    ..."sin cos tan asin acos atan sinh cosh tanh asinh acosh atanh exp abs cbrt sqrt ceil floor round sign log10"
      .split(" ")
      .map((x) => numMathOp(x)),
    numMathOp("ln", "log"),

    // Annoying numeric functions
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
    new Fn(g("hypot"), [anum, bnum], num, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value(Math.hypot(a.value as number, b.value as number), num)
      }
      if (props.lang != "glsl") {
        decl.global(`const ${hypotId}=Math.hypot;`)
      }
      return new Value(
        props.lang == "glsl" ?
          `length(vec2(${a!},${b!}))`
        : `${hypotId}(${a!},${b!})`,
        num,
      )
    }),
    new Fn(g("~="), [lnum, rnum], bool, ([l, r]) => {
      if (l!.const() && r!.const()) {
        return new Value(
          Math.abs((l.value as number) - (r.value as number)) < epsilon,
          bool,
        )
      }
      if (props.lang != "glsl") {
        decl.global(`const ${absId}=Math.abs;`)
      }
      return new Value(
        props.lang == "glsl" ?
          `abs(${l!},${r!})<${epsilon}`
        : `${absId}(${l!},${r!})<${epsilon}`,
        bool,
      )
    }),

    // Numeric constants
    new Fn(g("inf"), [], num, () => new Value(1 / 0, num)),
    new Fn(g("nan"), [], num, () => new Value(0 / 0, num)),
    new Fn(g("pi"), [], num, () => new Value(Math.PI, num)),
    new Fn(g("e"), [], num, () => new Value(Math.E, num)),
    new Fn(g("epsilon"), [], num, () => new Value(epsilon, num)),

    // Numeric checks
    new Fn(g("is_inf"), [xnum], bool, ([a]) => {
      if (a!.const()) {
        return new Value(1 / (a.value as number) == 0, bool)
      }
      return new Value(
        props.lang == "glsl" ? `isinf(${a})` : `1.0/(${a})==0.0`,
        bool,
      )
    }),
    new Fn(g("is_nan"), [xnum], bool, ([a]) => {
      if (a!.const()) {
        return new Value(isNaN(a.value as number), bool)
      }
      return new Value(
        props.lang == "glsl" ? `isnan(${a})` : `isNaN(${a})`,
        bool,
      )
    }),
    new Fn(g("is_finite"), [xnum], bool, ([a]) => {
      if (a!.const()) {
        return new Value(isFinite(a.value as number), bool)
      }
      if (props.lang == "glsl") {
        decl.global(
          `bool ${isFiniteId}(float x){return!is_nan(x)&&!is_inf(x);}`,
        )
      }
      return new Value(
        props.lang == "glsl" ? `${isFiniteId}(${a})` : `isFinite(${a})`,
        bool,
      )
    }),

    // Easy boolean operators
    boolBinOp("&&", (a, b) => a && b),
    boolBinOp("||", (a, b) => a || b),
    boolBinOp("==", (a, b) => a == b),
    boolBinOp("!=", (a, b) => a != b),

    // Annoying boolean operators
    new Fn(g("!"), [xbool], bool, ([a]) => {
      if (a!.const()) {
        return new Value(!(a.value as boolean), bool)
      }
      return new Value(`!(${a})`, bool)
    }),
  ]

  for (const f of fns) {
    decl.fns.push(f.id as GlobalId, f)
  }

  return decl
}
