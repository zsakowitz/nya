import type { WordKind } from "../../field/cmd/leaf/var"
import type { BigCmd } from "../../field/cmd/math/big"
import type { ParenLhs, ParenRhs } from "../../field/cmd/math/brack"
import type { Span } from "../../field/model"
import { isSubscript } from "../lib/text"
import { VARS } from "../ops/vars"
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
  | "withseq"
  | "base"
  | "while"
  | "until"
  | "from"
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
  DoubleStruckRight:  4, // x => 4x
  DoubleStruckBiDi:   3, // a <=> b
  Action:             2, // a -> a + 1
  Comma:              1, // 2, 3
  WordInfix:          0, // 3 base 4   // commas and word infixes are special-cased; they're weird
})

/** A map from binary operators to their precedences. */
export const PRECEDENCE_MAP = {
  __proto__: null,
  ".": Precedence.NotApplicable,
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
  "\\Rightarrow ": Precedence.DoubleStruckRight,
  "\\to ": Precedence.Action,
  ",": Precedence.Comma,
  base: Precedence.WordInfix,
  for: Precedence.WordInfix,
  with: Precedence.WordInfix,
  withseq: Precedence.WordInfix,
  until: Precedence.WordInfix,
  while: Precedence.WordInfix,
  from: Precedence.WordInfix,
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
    return PRECEDENCE_MAP[op] ?? Precedence.Comma
  } else {
    return PRECEDENCE_MAP[op.dir] ?? Precedence.Comma
  }
}

/** A punctuation token. */
export type Punc =
  | { type: "punc"; kind: "prefix"; value: PuncUnary }
  | { type: "punc"; kind: "suffix"; value: PuncUnary }
  | { type: "punc"; kind: "infix"; value: Exclude<PuncInfix, "."> }
  | { type: "punc"; kind: "infix"; value: "."; span: Span }
  | { type: "punc"; kind: "cmp"; value: PuncCmp }
  | { type: "punc"; kind: "pm"; value: PuncPm; span: Span }

/** A binary punctuation token. */
export type PuncBinary =
  | { type: "punc"; kind: "infix"; value: Exclude<PuncInfix, "."> }
  | { type: "punc"; kind: "infix"; value: "."; span: Span }
  | { type: "punc"; kind: "cmp"; value: PuncCmp }
  | { type: "punc"; kind: "pm"; value: PuncPm; span: Span }

/** A binary punctuation token. */
export type PuncBinaryNoComma =
  | { type: "punc"; kind: "infix"; value: Exclude<PuncInfix, "." | ","> }
  | { type: "punc"; kind: "infix"; value: "."; span: Span }
  | { type: "punc"; kind: "pm"; value: PuncPm; span: Span }

/** An infix punctuation token. */
export type PuncPrefix =
  | { type: "punc"; kind: "prefix"; value: PuncUnary }
  | { type: "punc"; kind: "pm"; value: PuncPm; span: Span }

/** A binary operation derived from infix operators. */
export type OpBinary = Exclude<PuncInfix | PuncPm, ",">

/** A variable or word in the AST. */
export type Var = {
  type: "var"
  value: string
  kind: WordKind
  sub?: Node
  sup?: Node
  span: Span | null
}

/** A plain, user-assignable variable. */
export type PlainVar = Var & { sup?: undefined; kind: "var" }

/**
 * A magic word in the AST; something like `iterate` which consumes all
 * succeeding tokens and voids the concept of precedence entirely.
 */
export type MagicVar = {
  type: "magicvar"
  value: string
  sub?: Node
  sup?: Node
  prop?: string
  contents: Node
}

export type Piece = { value: Node; condition: Node }

/** A top-level binding in the AST. */
export type AstBinding = {
  type: "binding"
  name: PlainVar
  args?: Node
  value: Node
}

/** All AST node types. This may be augmented. */
export interface Nodes {
  void: {}
  num: { value: string; sub?: Node; span: Span | null }
  text: { value: string }
  var: Var
  magicvar: MagicVar
  num16: { value: string }
  group: { lhs: ParenLhs; rhs: ParenRhs; value: Node }
  sub: { sub: Node }
  sup: { sup: Node }
  raise: { base: Node; exponent: Node }
  call: { on?: Node; name: Node; args: Node }
  frac: { a: Node; b: Node }
  mixed: { integer: string; a: string; b: string }
  piecewise: { pieces: Piece[] }
  matrix: { cols: number; values: Node[] }
  bigsym: { cmd: BigCmd | "\\int"; sub?: Node; sup?: Node }
  big: { cmd: BigCmd | "\\int"; sub?: Node; sup?: Node; of: Node }
  root: { contents: Node; root?: Node }
  index: { on: Node; index: Node }
  juxtaposed: { nodes: Node[] }
  op:
    | { kind: OpBinary; a: Node; b: Node; span: Span | null }
    | { kind: PuncUnary; a: Node; b?: undefined }
  commalist: { items: Node[] }
  cmplist: { items: Node[]; ops: PuncCmp[] }
  factorial: { on: Node; repeats: number | Node }
  error: { reason: string }
  binding: AstBinding
  punc: Punc
}

export type NodeName = keyof Nodes

/**
 * A part of the AST. The intermediate representation is so close to the final
 * representation that they're essentially merged.
 */
export type Node = { [K in NodeName]: Nodes[K] & { type: K } }[NodeName]

/** Parses a list of tokens into a complete AST. */
export function tokensToAst(tokens: Node[], maybeBinding: boolean): Node {
  if (
    maybeBinding &&
    tokens[0]?.type == "var" &&
    !tokens[0].sup &&
    tokens[0].kind == "var" &&
    (tokens[0].sub ? isSubscript(tokens[0].sub) : !(tokens[0].value in VARS)) &&
    ((tokens[1]?.type == "punc" &&
      tokens[1].kind == "cmp" &&
      tokens[1].value.dir == "=" &&
      !tokens[1].value.neg) ||
      (tokens[1]?.type == "group" &&
        tokens[1].lhs == "(" &&
        tokens[1].rhs == ")" &&
        tokens[2]?.type == "punc" &&
        tokens[2].kind == "cmp" &&
        tokens[2].value.dir == "=" &&
        !tokens[2].value.neg))
  ) {
    const args = tokens[1].type == "group" ? tokens[1].value : undefined
    return {
      type: "binding",
      name: tokens[0] as PlainVar,
      args,
      value: tokensToAst(tokens.slice(args ? 3 : 2), false),
    }
  }

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
