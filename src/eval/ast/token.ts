import type { WordKind } from "../../field/cmd/leaf/var"
import type { BigCmd } from "../../field/cmd/math/big"
import type { ParenLhs, ParenRhs } from "../../field/cmd/math/brack"
import { pass1_suffixes } from "./pass1.suffixes"
import { pass2_implicits } from "./pass2.implicits"
import { pass3_ordering } from "./pass3.ordering"

/** A punctuation token which can either be a prefix or an infix. */
export type PuncPm = "+" | "-" | "\\pm " | "\\mp "

/** A punctuation token which represents a binary comparison operator. */
export type PuncCmp =
  | { dir: "=" | "~" | "≈"; neg: boolean }
  | { dir: "<" | ">"; eq: boolean; neg: boolean }

/** A punctuation token which represents a binary operator. */
export type PuncInfix =
  | "for"
  | "with"
  | "base"
  | "\\and "
  | "\\or "
  | ".."
  | "..."
  | "\\cdot "
  | "÷"
  | "mod"
  | "\\to "
  | "\\Rightarrow "
  | "."
  | ","
  | "\\uparrow "
  | "juxtaposition"
  | "\\times "
  | "\\odot "
  | "\\otimes "

/** A punctuation token which represents a unary operator. */
export type PuncUnary = "\\neg " | PuncPm | "!"

/** The string tags for all binary operators. */
export type PuncBinaryStr = PuncInfix | PuncPm | PuncCmp["dir"]

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

/** A map from binary operators to their precedences. */
export const PRECEDENCE_MAP = {
  __proto__: null,
  ".": Precedence.NotApplicable,
  juxtaposition: Precedence.NotApplicable,
  "\\uparrow ": Precedence.Exponential,
  "\\cdot ": Precedence.Product,
  "\\times ": Precedence.Product,
  "\\odot ": Precedence.Product,
  "\\otimes ": Precedence.Product,
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
  "=": Precedence.Comparison,
  "~": Precedence.Comparison,
  "≈": Precedence.Comparison,
  "\\and ": Precedence.BoolAnd,
  "\\or ": Precedence.BoolOr,
  base: Precedence.WordInfix,
  for: Precedence.WordInfix,
  with: Precedence.WordInfix,
  "\\Rightarrow ": Precedence.DoubleStruckRight,
  "\\to ": Precedence.Action,
  ",": Precedence.Comma,
} satisfies Record<PuncBinaryStr, number> & {
  // TypeScript really needs to learn that __proto__ is special, but it hasn't yet.
  // And probably never will. Even though it's standardized.
  //
  // cries
  __proto__: null
} as Record<PuncBinaryStr, number>

/** Gets the precedence of some operator. */
export function getPrecedence(op: PuncBinary["value"]) {
  if (typeof op == "string") {
    return PRECEDENCE_MAP[op] ?? Precedence.WordInfix
  } else {
    return PRECEDENCE_MAP[op.dir] ?? Precedence.WordInfix
  }
}

/** A punctuation token. */
export type Punc =
  | { type: "punc"; kind: "prefix"; value: PuncUnary }
  | { type: "punc"; kind: "suffix"; value: PuncUnary }
  | { type: "punc"; kind: "infix"; value: PuncInfix }
  | { type: "punc"; kind: "cmp"; value: PuncCmp }
  | { type: "punc"; kind: "pm"; value: PuncPm }

/** A binary punctuation token. */
export type PuncBinary =
  | { type: "punc"; kind: "infix"; value: PuncInfix }
  | { type: "punc"; kind: "cmp"; value: PuncCmp }
  | { type: "punc"; kind: "pm"; value: PuncPm }

/** A binary punctuation token. */
export type PuncBinaryNoComma =
  | { type: "punc"; kind: "infix"; value: Exclude<PuncInfix, ","> }
  | { type: "punc"; kind: "pm"; value: PuncPm }

/** An infix punctuation token. */
export type PuncPrefix =
  | { type: "punc"; kind: "prefix"; value: PuncUnary }
  | { type: "punc"; kind: "pm"; value: PuncPm }

/** A binary operation derived from infix operators. */
export type OpBinary = Exclude<PuncBinary["value"], ",">

/**
 * A part of the AST. The intermediate representation is so close to the final
 * representation that they're essentially merged.
 */
export type Node =
  | { type: "void" }
  | { type: "num"; value: string; sub?: Node }
  | { type: "var"; value: string; kind: WordKind; sub?: Node; sup?: Node }
  | { type: "num16"; value: string }
  | { type: "group"; lhs: ParenLhs; rhs: ParenRhs; value: Node }
  | { type: "sub"; sub: Node }
  | { type: "sup"; sup: Node }
  | { type: "raise"; base: Node; exponent: Node }
  | { type: "call"; on?: Node; name: Node; args: Node }
  | { type: "frac"; a: Node; b: Node }
  | { type: "mixed"; integer: string; a: string; b: string }
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
  | { type: "cmplist"; items: Node[]; ops: PuncCmp[] }
  | { type: "factorial"; on: Node; repeats: number | Node }
  | { type: "error"; reason: string }
  | Punc

/** Parses a list of tokens into a complete AST. */
export function tokensToAst(tokens: Node[]): Node {
  tokens = pass1_suffixes(tokens)
  tokens = pass2_implicits(tokens)
  return pass3_ordering(tokens)
}

/**
 * Returns whether the passed token is a value or not (e.g. can directly be
 * computed as a mathematical expression). For instance, `23` is a token, but
 * `.` is not.
 */
export function isValueToken(token: Node | undefined) {
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
