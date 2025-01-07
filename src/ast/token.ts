import type { BigCmd } from "../field/cmd/math/big"
import type { ParenLhs, ParenRhs } from "../field/cmd/math/brack"
import { pass1_suffixes } from "./pass1.suffixes"

/** A punctuation token which can either be a prefix or an infix. */
export type PuncPm = "+" | "-" | "\\pm " | "\\mp "

/** A punctuation token which represents a binary operator. */
export type PuncBinary =
  | "for"
  | "with"
  | "base"
  | "\\and "
  | "\\or "
  | "="
  | "<"
  | ">"
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

/** A punctuation token which represents a unary operator. */
export type PuncUnary = "\\neg " | PuncPm | "!"

/**
 * Additional elements and rules apply during parsing:
 *
 * 1. During {@linkcode Precedence.Factorial}, superscripts are parsed.
 * 2. After {@linkcode Precedence.MemberAccess}, function calls are parsed.
 * 3. Interspersed with {@linkcode Precedence.Product} and the prefix variants of
 *    {@linkcode Precedence.Sum}, implicit multiplication, implicit function
 *    calls, and big objects like summation notation and integrals are parsed.
 *    {@linkcode Precedence.Product} is parsed with a very different technique
 *    from other levels, but it produces the same results.
 */
// prettier-ignore
export const Precedence = Object.freeze({
  Factorial:         15, // 23!
  MemberAccess:      14, // [1, 2, 3].min
  Exponential:       13, // x ↑ 3
  Product:           12, // x ÷ y
  Sum:               11, // 2 + 3
  Range:             10, // 1...100
  Comparison:         9, // x² < 3
  Equality:           8, // x = 3
  BoolNegate:         7, // ¬x
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
// ATOMS = EXP (md pm* EXP)*
// FN = (fn pm*)+ ATOMS
// WORD = pm* ATOMS? FN*
// PHRASE = WORD (big WORD)*

// Would be awesome if these things Just Worked™:
// 16!.lcm(5)        (16!).lcm(5)
// sin a cos b       (sin a)(cos b)
// sin 2a            sin(2a)
// 2 ∑n²             (2)(∑n²)

export const PRECEDENCE_MAP: Readonly<Record<PuncUnary | PuncBinary, number>> =
  {
    "!": Precedence.Factorial,
    ".": Precedence.MemberAccess,
    "+": Precedence.Sum,
    "-": Precedence.Sum,
    "\\pm ": Precedence.Sum,
    "\\mp ": Precedence.Sum,
    "\\cdot ": Precedence.Product,
    "÷": Precedence.Product,
    mod: Precedence.Product,
    "\\to ": Precedence.Action,
    "\\Rightarrow ": Precedence.DoubleStruckRight,
    ",": Precedence.Comma,
    "..": Precedence.Range,
    "...": Precedence.Range,
    "<": Precedence.Comparison,
    ">": Precedence.Comparison,
    "=": Precedence.Equality,
    "\\and ": Precedence.BoolAnd,
    "\\neg ": Precedence.BoolNegate,
    "\\or ": Precedence.BoolOr,
    base: Precedence.WordInfix,
    for: Precedence.WordInfix,
    with: Precedence.WordInfix,
  }

export const ASSOC_MAP: Readonly<Partial<Record<PuncUnary | PuncBinary, 1>>> =
  {}

/** A punctuation token. */
export type Punc =
  | { type: "prefix"; kind: PuncUnary }
  | { type: "suffix"; kind: PuncUnary }
  | { type: "infix"; kind: PuncBinary }
  | { type: "pm"; kind: PuncPm }

/** A part of the AST's intermediate representation. */
export type Token =
  | { type: "num"; value: string; sub?: Node }
  | { type: "var"; value: string; sub?: Node; sup?: Node }
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
  | { type: "op"; kind: PuncBinary; a: Node; b: Node }
  | { type: "op"; kind: PuncUnary; a: Node; b?: undefined }
  | { type: "factorial"; on: Node; repeats: number }
  | { type: "error"; reason: string }

/** A node in the final AST. */
export type Node = Token

/** Parses a list of tokens into a complete AST. */
export function tokensToAst(tokens: Token[]): Node {
  pass1_suffixes(tokens)
  return tokens as any
}

/**
 * Returns whether the passed token is a value or not (e.g. can directly be
 * computed as a mathematical expression). For instance, `23` is a token, but
 * `.` is not.
 */
export function isValueToken(token: Token) {
  return !(
    token.type == "bigsym" ||
    token.type == "error" ||
    token.type == "punc" ||
    token.type == "sub" ||
    token.type == "sup"
  )
}
