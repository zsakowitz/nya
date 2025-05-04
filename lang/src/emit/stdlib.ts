import { Declarations, Fn, ScalarTy } from "./decl"
import type {
  BroadcastBinaryDefinition,
  BroadcastUnaryDefinition,
} from "./emit"
import { name, names } from "./id"
import type { EmitProps, Lang } from "./props"

export const num = new ScalarTy(
  name`num`,
  (props) => (props.lang == "glsl" ? "float" : "number"),
  { type: "vec", of: "float", count: 1 },
)
export const bool = new ScalarTy(name`bool`, () => "boolean", {
  type: "vec",
  of: "bool",
  count: 1,
})
export const void_ = new ScalarTy(name`void`, () => "void", { type: "void" })

export const types = [num, bool]

const lnum = { id: name`lhs`, type: num }
const rnum = { id: name`rhs`, type: num }
const xnum = { id: name`x`, type: num }

const lbool = { id: name`lhs`, type: bool }
const rbool = { id: name`rhs`, type: bool }
const xbool = { id: name`x`, type: bool }

function math(f: (props: EmitProps, args: string[]) => string) {
  return (props: EmitProps, args: string[]): string => {
    const val = f(props, args)
    if (props.lang == "glsl") {
      return val
    } else {
      return "Math." + val
    }
  }
}

function numericFn(name: string) {
  return new Fn(
    names.of(name),
    [xnum],
    num,
    math((_, args) => `${name}(${args.join(",")})`),
  )
}

function epsilon(lang: Lang) {
  return lang == "glsl" ? "1.1920928955078125e-7" : "2.220446049250313e-16"
}

// function epsilonM1(lang: Lang) {
//   return lang == "glsl" ? "0.9999999403953552" : "0.9999999999999999"
// }
//
// function epsilonP1(lang: Lang) {
//   return lang == "glsl" ? "1.0000001192092896" : "1.0000000000000002"
// }

export const fns = [
  // Basic numeric operators
  new Fn(name`-`, [xnum], num, (_, [a]) => `-(${a})`),
  new Fn(name`+`, [lnum, rnum], num, (_, [a, b]) => `(${a})+(${b})`),
  new Fn(name`-`, [lnum, rnum], num, (_, [a, b]) => `(${a})-(${b})`),
  new Fn(name`*`, [lnum, rnum], num, (_, [a, b]) => `(${a})*(${b})`),
  new Fn(name`%`, [lnum, rnum], num, (props, [a, b]) =>
    props.lang == "glsl" ? `mod(${a},${b})` : `(${a})%(${b})`,
  ),
  new Fn(name`/`, [lnum, rnum], num, (_, [a, b]) => `(${a})/(${b})`),
  new Fn(
    name`**`,
    [lnum, rnum],
    num,
    math((_, [a, b]) => `pow(${a},${b})`),
  ),

  // Numeric comparison operators
  new Fn(name`==`, [lnum, rnum], bool, (_, [a, b]) => `(${a})==(${b})`),
  new Fn(name`~=`, [lnum, rnum], bool, (props, [a, b]) => {
    const abs = props.lang == "glsl" ? "abs" : "Math.abs"
    return `${abs}((${a})-(${b}))<=${epsilon(props.lang)}`
  }),
  new Fn(name`!=`, [lnum, rnum], bool, (_, [a, b]) => `(${a})!=(${b})`),
  new Fn(name`<`, [lnum, rnum], bool, (_, [a, b]) => `(${a})<(${b})`),
  new Fn(name`>`, [lnum, rnum], bool, (_, [a, b]) => `(${a})>(${b})`),
  new Fn(name`<=`, [lnum, rnum], bool, (_, [a, b]) => `(${a})<=(${b})`),
  new Fn(name`>=`, [lnum, rnum], bool, (_, [a, b]) => `(${a})>=(${b})`),

  // Numeric functions
  ..."sin cos tan asin acos atan sinh cosh tanh asinh acosh atanh exp abs cbrt sqrt ceil floor sign log10"
    .split(" ")
    .map(numericFn),
  new Fn(
    name`atan`,
    [
      { id: name`y`, type: num },
      { id: name`x`, type: num },
    ],
    num,
    (props, [y, x]) =>
      props.lang == "glsl" ? `atan(${y},${x})` : `Math.atan2(${y},${x})`,
  ),
  new Fn(name`ln`, [xnum], num, numericFn("log").of),
  new Fn(name`hypot`, [lnum, rnum], num, (props, [a, b]) =>
    props.lang == "glsl" ? `length(vec2(${a},${b}))` : `Math.hypot(${a},${b})`,
  ),

  // Boolean comparison operators
  new Fn(name`==`, [lbool, rbool], bool, (_, [a, b]) => `(${a})==(${b})`),
  new Fn(name`!=`, [lbool, rbool], bool, (_, [a, b]) => `(${a})!=(${b})`),
  new Fn(name`&&`, [lbool, rbool], bool, (_, [a, b]) => `(${a})&&(${b})`),
  new Fn(name`||`, [lbool, rbool], bool, (_, [a, b]) => `(${a})||(${b})`),
  new Fn(name`!`, [xbool], bool, (_, [a]) => `!(${a})`),

  // Additional constants
  new Fn(name`inf`, [], num, (p) => (p.lang == "glsl" ? "(1.0/0.0)" : "(1/0)")),
  new Fn(name`nan`, [], num, (p) => (p.lang == "glsl" ? "(0.0/0.0)" : "(0/0)")),
  new Fn(name`pi`, [], num, () => Math.PI.toString()),
  new Fn(name`e`, [], num, () => Math.E.toString()),
  new Fn(name`epsilon`, [], num, (p) => epsilon(p.lang)),
]

export function createStdlibDecls() {
  const decl = new Declarations(null)
  for (const ty of types) {
    decl.types.init(ty.id, ty)
  }
  for (const fn of fns) {
    decl.fns.push(fn.id, fn)
  }
  return decl
}

function bbOp(name: string): BroadcastBinaryDefinition {
  return {
    name: "@" + name,
    on: ["float", "int", "uint"],
    op: (_, a, b) => `(${a})${name}(${b})`,
  }
}

function buOp(name: string): BroadcastUnaryDefinition {
  return {
    name: "@" + name,
    on: ["float", "int", "uint"],
    op: (_, a) => `${name}(${a})`,
  }
}

export const broadcastBinaryOps = {
  [name`@+`.value]: bbOp("+"),
  [name`@-`.value]: bbOp("-"),
  [name`@*`.value]: bbOp("*"),
  [name`@/`.value]: bbOp("/"),
}

export const broadcastUnaryOps = {
  [name`@-`.value]: buOp("-"),
}
