import type { WordKind } from "../field/cmd/leaf/var"
import type { BigCmd } from "../field/cmd/math/big"
import type { ParenLhs, ParenRhs } from "../field/cmd/math/brack"
import { pass1_suffixes } from "./pass1.suffixes"
import { pass2_implicits } from "./pass2.implicits"
import { pass3_ordering } from "./pass3.ordering"

/** A punctuation token which can either be a prefix or an infix. */
export type PuncPm = "+" | "-" | "\\pm " | "\\mp "

/** A punctuation token which represents a binary operator. */
export type PuncBinary =
  | "for"
  | "with"
  | "base"
  | "\\and "
  | "\\or "
  | { dir: "="; neg: boolean }
  | { dir: "<" | ">"; eq: boolean; neg: boolean }
  | ".."
  | "..."
  | PuncPm
  | "\\cdot "
  | "÷"
  | "mod"
  | "\\to "
  | "\\Rightarrow "
  | "."
  | ","
  | "\\uparrow "

/** A punctuation token which represents a unary operator. */
export type PuncUnary = "\\neg " | PuncPm | "!"

/** The string tags for all binary operators. */
export type PuncBinaryStr =
  PuncBinary extends infer T ?
    T extends string ? T
    : T extends { dir: infer U extends string } ? U
    : never
  : never

/**
 * Additional elements and rules apply during parsing:
 *
 * 1. During {@linkcode Precedence.NotApplicable}, superscripts are parsed.
 * 2. All {@linkcode Precedence.Exponential} operators are automatically
 *    right-associative.
 * 3. After {@linkcode Precedence.MemberAccess}, function calls are parsed.
 * 4. Interspersed with {@linkcode Precedence.Product} and the prefix variants of
 *    {@linkcode Precedence.Sum}, implicit multiplication, implicit function
 *    calls, and big objects like summation notation and integrals are parsed.
 *    {@linkcode Precedence.Product} is parsed with a very different technique
 *    from other levels, but it produces the same results.
 */
// prettier-ignore
export const Precedence = Object.freeze({
  NotApplicable:     -1, // 23!, ¬x, dotted access
  Exponential:       12, // x ↑ 3
  Product:           11, // x ÷ y
  Sum:               10, // 2 + 3
  Range:              9, // 1...100
  Comparison:         8, // x² < 3
  Equality:           7, // x = 3
  BoolAnd:            6, // x ∧ y
  BoolOr:             5, // x ⋁ y
  WordInfix:          4, // 23 base 5
  DoubleStruckRight:  3, // x => 4x
  DoubleStruckBiDi:   2, // a <=> b
  Action:             1, // a -> a + 1
  Comma:              0, // 2, 3
})

// function parse_expression(tokens: Token[], min_precedence = 0) {
//   tokens = tokens.slice()
//   const result = parse_expression_1(parse_primary(), min_precedence)
//   return result ? [result, ...tokens] : tokens
//
//   function parse_primary() {
//     return tokens.shift()
//   }
//
//   function parse_expression_1(lhs: Token | undefined, min_precedence: number) {
//     if (!lhs) {
//       return
//     }
//     let lookahead = tokens[0]
//     while (
//       lookahead?.type == "punc" &&
//       (lookahead.value.type == "infix" || lookahead.value.type == "pm") &&
//       lookahead.value.precedence >= min_precedence
//       // lookahead is a binary operator whose precedence is >= min_precedence
//     ) {
//       let op = lookahead.value
//       parse_primary()
//       let rhs = parse_primary()
//       lookahead = tokens[0] // peek next token
//       while (
//         lookahead?.type == "punc" &&
//         (lookahead.value.type == "infix" || lookahead.value.type == "pm") &&
//         (lookahead.value.precedence > min_precedence ||
//           (lookahead.value.assoc == 1 &&
//             lookahead.value.precedence == min_precedence))
//         //lookahead is a binary operator whose precedence is greater
//         //     than op's, or a right-associative operator
//         //   whose precedence is equal to op's
//       ) {
//         rhs = parse_expression_1(
//           rhs,
//           op.precedence + +(lookahead.value.precedence > op.precedence),
//         ) // precedence of op + (1 if lookahead precedence is greater, else 0))
//         lookahead = tokens[0]
//       }
//       if (!rhs) {
//         return
//       }
//       lhs = { type: "op", kind: op.kind as PuncBinary, a: lhs!, b: rhs } // the result of applying op with operands lhs and rhs
//     }
//     return lhs
//   }
// }

// console.log(
//   JSON.stringify(
//     parse_expression(
//       [
//         { type: "num", value: "24" },
//         {
//           type: "punc",
//           value: {
//             type: "pm",
//             assoc: -1,
//             kind: "+",
//             precedence: Precedence.Sum,
//           },
//         },
//         { type: "num", value: "68" },
//         {
//           type: "punc",
//           value: {
//             type: "pm",
//             assoc: -1,
//             kind: "+",
//             precedence: Precedence.Sum,
//           },
//         },
//         { type: "num", value: "09" },
//         {
//           type: "punc",
//           value: {
//             type: "infix",
//             assoc: -1,
//             kind: "\\cdot ",
//             precedence: Precedence.Product,
//           },
//         },
//         { type: "num", value: "9" },
//       ],
//       Precedence.Sum,
//     ),
//     undefined,
//     2,
//   ),
// )

// rules governing implicits:
//
// TINY TOKENS
//   atom = x, x², (...), x.y, x!, etc.
//   fn   = any implicit function name (sin, cos, log, ln)
//   ex   = any exponentiation-like operator (↑, ^)
//   md   = any multiplication-level operator (*, ÷, mod)
//   pm   = any plus-or-minus-like operator (+, -, ±, ∓)
//   big  = any big operator (∑, ∏, ∫)
//
// EXP = atom+ (ex pm* atom+)*
// MUL = EXP (md pm* EXP)*
// FN = (fn pm*)+ MUL
// WORD = pm* MUL? FN*
// PHRASE = WORD (big WORD)*

// Would be awesome if these things Just Worked™:
// 16!.lcm(5)        (16!).lcm(5)
// sin a cos b       (sin a)(cos b)
// sin 2a            sin(2a)
// 2 ∑n²             (2)(∑n²)

export const PRECEDENCE_MAP = {
  ".": Precedence.NotApplicable,
  "\\uparrow ": Precedence.Exponential,
  "\\cdot ": Precedence.Product,
  "÷": Precedence.Product,
  mod: Precedence.Product,
  "+": Precedence.Sum,
  "-": Precedence.Sum,
  "\\pm ": Precedence.Sum,
  "\\mp ": Precedence.Sum,
  "..": Precedence.Range,
  "...": Precedence.Range,
  "<": Precedence.Comparison,
  ">": Precedence.Comparison,
  "=": Precedence.Equality,
  "\\and ": Precedence.BoolAnd,
  "\\or ": Precedence.BoolOr,
  base: Precedence.WordInfix,
  for: Precedence.WordInfix,
  with: Precedence.WordInfix,
  "\\Rightarrow ": Precedence.DoubleStruckRight,
  "\\to ": Precedence.Action,
  ",": Precedence.Comma,
} satisfies Record<PuncBinaryStr, number>

/** Gets the predence of some operator. */
export function getPrecedence(op: PuncBinary) {
  if (typeof op == "string") {
    return PRECEDENCE_MAP[op]
  } else {
    return PRECEDENCE_MAP[op.dir]
  }
}

/** A punctuation token. */
export type Punc =
  | { type: "prefix"; kind: PuncUnary }
  | { type: "suffix"; kind: PuncUnary }
  | { type: "infix"; kind: PuncBinary }
  | { type: "pm"; kind: PuncPm }

/** An infix punctuation token. */
export type PuncInfix =
  | { type: "infix"; kind: PuncBinary }
  | { type: "pm"; kind: PuncPm }

/** A binary operation derived from infix operators. */
export type OpBinary = Exclude<PuncBinary, ",">

/** A part of the AST's intermediate representation. */
export type Token =
  | { type: "void" }
  | { type: "num"; value: string; sub?: Node }
  | { type: "var"; value: string; kind: WordKind; sub?: Node; sup?: Node }
  | { type: "num16"; value: string }
  | { type: "punc"; value: Punc }
  | { type: "group"; lhs: ParenLhs; rhs: ParenRhs; value: Node }
  | { type: "sub"; sub: Node }
  | { type: "sup"; sup: Node }
  | { type: "raise"; base: Node; exponent: Node }
  | { type: "call"; on?: Node; name: Node; args: Node }
  | { type: "frac"; a: Node; b: Node }
  | { type: "for"; mapped: Node; bound: Node; source: Node }
  | { type: "piecewise"; pieces: { value: Node; condition: Node }[] }
  | { type: "matrix"; cols: number; values: Node[] }
  | { type: "bigsym"; cmd: BigCmd | "\\int"; sub?: Node; sup?: Node }
  | { type: "big"; cmd: BigCmd | "\\int"; sub?: Node; sup?: Node; of: Node }
  | { type: "root"; contents: Node; root?: Node }
  | { type: "index"; on: Node; index: Node }
  | { type: "juxtaposed"; a: Node; b: Node }
  | { type: "op"; kind: OpBinary; a: Node; b: Node }
  | { type: "op"; kind: PuncUnary; a: Node; b?: undefined }
  | { type: "commalist"; items: Node[] }
  | { type: "factorial"; on: Node; repeats: number }
  | { type: "error"; reason: string }

/** A node in the final AST. */
export type Node = Token

/** Parses a list of tokens into a complete AST. */
export function tokensToAst(tokens: Token[]): Node {
  tokens = pass1_suffixes(tokens)
  tokens = pass2_implicits(tokens)
  return pass3_ordering(tokens)
}

/**
 * Returns whether the passed token is a value or not (e.g. can directly be
 * computed as a mathematical expression). For instance, `23` is a token, but
 * `.` is not.
 */
export function isValueToken(token: Token | undefined) {
  return !(
    token == null ||
    token.type == "bigsym" ||
    token.type == "error" ||
    token.type == "punc" ||
    token.type == "sub" ||
    token.type == "sup" ||
    (token.type == "var" && token.kind != "var")
  )
}
