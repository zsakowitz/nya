import type { BigCmd } from "../field/cmd/math/big"
import type { ParenLhs, ParenRhs } from "../field/cmd/math/brack"

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
  | "->"
  | "=>"
  | "."

/** A punctuation token which represents a unary operator. */
export type PuncUnary = "\\neg " | PuncPm | "!"

/** Negative precedence */
export type PuncPrecedence = 2

export type Punc =
  | { type: "prefix"; kind: PuncUnary; precedence: PuncPrecedence }
  | { type: "suffix"; kind: PuncUnary; precedence: PuncPrecedence }
  | { type: "infix"; kind: PuncBinary; precedence: PuncPrecedence }
  | { type: "pm"; kind: PuncPm; precedence: PuncPrecedence }

/** An operation. */
export type Operation =
  | { type: ","; items: Node[] }
  | { type: "binary"; kind: PuncBinary; a: Node; b: Node }
  | { type: "unary"; kind: PuncUnary; a: Node }

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
