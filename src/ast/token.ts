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

/** Higher is tighter. See the source for reserved precedence levels. */
export type PuncPrecedence = Exclude<
  | 15 // factorials                       23!
  | 14 // member access                    [1, 2, 3].min
  | 13 // explicit function calls          sin(23)
  | 12 // exponentials [future expansion]  x ↑ 3
  | 11 // implicit multiplication          xy
  | 10 // products                         x ÷ y
  | 9 // implicit function calls           sin 2x³
  | 8 // summation notation                ∑n²
  | 7 // implicit multiplication again     2∑n²
  | 6 // implicit fn calls again           sin 2∑n²
  | 5 // sums                              2 + 3
  | 4 // ranges                            1...100
  | 3 // comparators                       x² < 3
  | 2 // equality operators                x = 3
  | 1 // negation                          ¬x
  | 0, // boolean combinators              x ∧ y
  13 | 12 | 11 | 9 | 8 | 7 | 6
>

// rules for implicits to Just Work™:
// exp = anything held together by operators of precedence "exponential" or higher
// term = exp+ (fn+ | sum)?
// prod = term ("*" term)*
// fn = "sin" (fn | (prod | sum)+)
// sum = "∑" (prod | fn | sum)+

// Would be awesome if these things Just Worked™:
// 16!.lcm(5)        (16!).lcm(5)
// sin a cos b       (sin a)(cos b)
// sin 2a            sin(2a)
// 2 ∑n²             (2)(∑n²)

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
