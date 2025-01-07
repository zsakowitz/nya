import type { BigCmd } from "../field/cmd/math/big"
import type { ParenLhs, ParenRhs } from "../field/cmd/math/brack"

/** A combinator-like punctuation token. */
export type PuncCombo = "\\and " | "\\or "

/** A negation-like punctuation token. */
export type PuncNeg = "\\neg "

/** An equality-like punctuation token. */
export type PuncEq = "="

/** A comparison-like punctuation token. */
export type PuncCmp = "<" | ">"

/** A product/quotient/modulus-like punctuation token. */
export type PuncProd = "\\cdot " | "÷"

/** A plus-or-minus-like punctuation token. */
export type PuncPm = "+" | "-" | "\\pm " | "\\mp "

/** A factorial-like punctuation token. */
export type PuncFact = "!"

/** A punctuation token. Listed here in approximate order of precedence. */
export type Punc =
  | ","
  | "->"
  | "=>"
  | "." // "." has very low precedence in `a..b` and `a...b` ranges
  | { type: "neg"; kind: PuncNeg }
  | { type: "combo"; kind: PuncCombo }
  | { type: "eq"; kind: PuncEq; neg: boolean }
  | { type: "cmp"; kind: PuncCmp; neg: boolean; eq: boolean }
  | { type: "pm"; kind: PuncPm } // "pm" have different precedence as prefixes and as infixes
  | { type: "prod"; kind: PuncProd }
  | { type: "pm"; kind: PuncPm } // "pm" have different precedence as prefixes and as infixes
  | "." // "." has very high precedence in `.property` accesses
  | { type: "suffix"; kind: PuncFact }

/** A part of the AST's intermediate representation. */
export type Token = Readonly<
  | { type: "num"; value: string }
  | { type: "num16"; value: string }
  | { type: "var"; value: string }
  | { type: "punc"; value: Punc }
  | { type: "group"; lhs: ParenLhs; rhs: ParenRhs; value: Node }
  | { type: "lonesub"; sub: Node }
  | { type: "lonesup"; sup: Node }
  | { type: "sub"; on: Node; sub: Node }
  | { type: "call"; name: Node; on?: Node; args: Node[] }
  | { type: "frac"; a: Node; b: Node }
  | { type: "for"; mapped: Node; bound: Node; source: Node }
  | { type: "piecewise"; pieces: { value: Node; condition: Node }[] }
  | { type: "matrix"; cols: number; values: Node[] }
  | { type: "big"; cmd: BigCmd | "\\int"; sub?: Node; sup?: Node }
  | { type: "root"; contents: Node; root?: Node }
  | { type: "error"; reason: string }
>

/** A node in the final AST. */
export type Node = Token

/** Parses a list of tokens into a complete AST. */
export function tokensToAst(tokens: Token[]): Node {
  return { type: "tokens", tokens } as any
}
