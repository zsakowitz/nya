import type { WordKind } from "@/field/cmd/leaf/var"
import type { BigCmd } from "@/field/cmd/math/big"
import type { ParenLhs, ParenRhs } from "@/field/cmd/math/brack"
import type { Span } from "@/field/model"
import type { FnParam } from "../lib/binding"
import type { Sym } from "../sym"
import type { GlslValue, JsValue } from "../ty"

/** Tokens which can be parsed both as a binary infix and as a prefix. */
interface PuncListPm {
  "+": 0
  "-": 0
  "\\pm ": 0
  "\\mp ": 0
}

/** Tokens which can be part of a comparison list. */
interface PuncListCmp {
  "cmp-eq": 0
  "cmp-tilde": 0
  "cmp-approx": 0
  "cmp-neq": 0
  "cmp-ntilde": 0
  "cmp-napprox": 0
  "cmp-lt": 0
  "cmp-lte": 0
  "cmp-gt": 0
  "cmp-gte": 0
  "cmp-nlt": 0
  "cmp-nlte": 0
  "cmp-ngt": 0
  "cmp-ngte": 0
}

/** Tokens which can be binary operators. */
export interface PuncListInfix extends PuncListPm, PuncListCmp {
  for: 0
  with: 0
  withseq: 0
  base: 0
  deriv: 0
  "..": 0
  "...": 0
  "\\cdot ": 0
  "÷": 0
  mod: 0
  "\\to ": 0
  "\\Rightarrow ": 0
  ".": 0
  ",": 0
  "\\uparrow ": 0
  "\\times ": 0
  "\\odot ": 0
  "\\otimes ": 0
  ":": 0
  "\\and ": 0
  "\\or ": 0
}

/** Tokens which can be unary prefix operators. */
interface PuncListPrefix extends PuncListPm {
  "\\neg ": 0
}

/** Tokens which can be unary suffix operators. */
interface PuncListSuffix {
  "!": 0
}

/** A punctuation token which can either be a prefix or an infix. */
export type PuncPm = keyof PuncListPm

/** A punctuation token which represents a binary comparison operator. */
export type PuncCmp = keyof PuncListCmp

/** A punctuation token which represents a binary operator. */
export type PuncInfix = keyof PuncListInfix

/** A punctuation token which represents a unary operator. */
export type PuncUnary = keyof PuncListPrefix | keyof PuncListSuffix

/** The string tags for all binary operators. */
export type PuncBinaryStr = PuncInfix | PuncPm | PuncCmp

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

  Var:               99, // a variable name (only used in sym)
  Numeric:           98, // 7, 2.3 (only used in sym; excludes negatives)
  Atom:              97, // f(x), x², dotted access (only used in sym)
  Juxtaposition:     96, // 2x (only used in sym)

  Exponential:       16, // x ↑ 3
  Product:           15, // x ÷ y
  ImplicitFnCall:    14, // ln 2x (only used in sym)
  Sum:               13, // 2 + 3
  UnitConversion:    12, // 2m in cm
  Range:             11, // 1...100
  Comparison:        10, // x² < 3
  Equality:           9, // x = 3
  BoolAnd:            8, // x ∧ y
  BoolOr:             7, // x ⋁ y
  DoubleStruckRight:  6, // x => 4x
  DoubleStruckBiDi:   5, // a <=> b
  Action:             4, // a -> a + 1
  Colon:              3, // a: b
  Comma:              2, // 2, 3
  WordInfix:          1, // 3 base 4, a with a=5
  WordInfixList:      0, // 2, 3 from 4 // commas and word infixes are special-cased; they're weird
})

/** A map from binary operators to their precedences. */
export const PRECEDENCE_MAP: Partial<Record<PuncBinaryStr, number>> = {
  "\\otimes ": Precedence.Product,
  "\\pm ": Precedence.Sum,
  "\\mp ": Precedence.Sum,
  "..": Precedence.Range,
  "...": Precedence.Range,
  "\\Rightarrow ": Precedence.DoubleStruckRight,
  "\\to ": Precedence.Action,
  ":": Precedence.Colon,
  ",": Precedence.Comma,
}
Object.setPrototypeOf(PRECEDENCE_MAP, null)

/** Gets the precedence of some operator. */
export function getPrecedence(op: PuncBinary["value"]) {
  const prec = PRECEDENCE_MAP[op]
  if (prec == null) {
    throw new Error(`The operator '${op}' isn't defined.`)
  }
  return prec
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
 * A magic word in the AST. Used to pass unparsed arguments to functions (e.g.
 * sym, eval) and when a function defies standard precedence rules (e.g. unit,
 * iterate).
 *
 * Magic words come in many varieties:
 *
 * - The `iterate` flavor, where it simply consumes all following tokens.
 * - The `sym` flavor, where it has function-level precedence but accepts tokens.
 * - The `unit` flavor, where it is just a word prefix.
 */
export type MagicVar = {
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
  params: FnParam[] | null
  value: Node
}

/** All AST suffix-like node types. This may be augmented. */
export interface Suffixes {
  prop: { name: Var }
  call: { args: Node }
  method: { name: Var; args: Node }
  raise: { exp: Node }
  factorial: { repeats: number | Node }
  index: { index: Node }
}

/** All AST node types. This may be augmented. */
export interface Nodes {
  void: {}
  num: { value: string; sub?: Node; span: Span | null }
  var: Var
  field: { value: string; sub?: Node }
  magicvar: MagicVar
  num16: { value: string }
  group: { lhs: ParenLhs; rhs: ParenRhs; value: Node }
  sub: { sub: Node }
  sup: { sup: Node }
  frac: { a: Node; b: Node }
  mixed: { integer: string; a: string; b: string }
  piecewise: { pieces: Piece[] }
  matrix: { cols: number; values: Node[] }
  bigsym: { cmd: BigCmd | "\\int"; sub?: Node; sup?: Node }
  big: { cmd: BigCmd | "\\int"; sub?: Node; sup?: Node; of: Node }
  root: { contents: Node; root?: Node }
  juxtaposed: { nodes: Node[] }
  op:
    | { kind: OpBinary; a: Node; b: Node; span: Span | null }
    | { kind: PuncUnary; a: Node; b?: undefined }
  commalist: { items: Node[] }
  cmplist: { items: Node[]; ops: PuncCmp[] }
  error: { reason: string }
  binding: AstBinding
  punc: Punc
  value: { value: JsValue }
  valueGlsl: { value: GlslValue }
  sym: { value: Sym }
  suffixed: { base: Node; suffixes: readonly Suffix[] }
  dd: { wrt: PlainVar }
  deriv: { wrt: PlainVar; of: Node }
}

export type NodeName = keyof Nodes
export type SuffixName = keyof Suffixes

/**
 * An AST node.
 *
 * Because the command and block system takes care of most parsing ambiguities,
 * the same node type is used for intermediate and final representations, just
 * with different transforms applied.
 *
 * An intermediate tree is typically an array of nodes (so that `2+3,4` might be
 * five tokens), but a final tree is just one (so that `2+3,4` would be
 * `((2)+(3)),(4)`).
 */
export type Node = { [K in NodeName]: Nodes[K] & { type: K } }[NodeName]

/**
 * A suffix which binds tightly after another value, like function calls,
 * factorials, property accesses, and superscripts.
 *
 * Suffixes involve some parsing ambiguity, so they are separated from other
 * items. For instance, `a(b)!²` could either be `(a(b))!²` if `a` is a
 * function, or `a*(b!²)` if `a` is a plain variable.
 */
export type Suffix = {
  [K in SuffixName]: Suffixes[K] & { type: K }
}[SuffixName]

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
    (token.type == "var" && token.kind != "var") ||
    token.type == "dd"
  )
}
