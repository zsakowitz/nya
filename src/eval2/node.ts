import type { ParenLhs, ParenRhs } from "@/field/cmd/math/brack"

export interface Leaf {
  num: string
  num16: string
  frac: [Node, Node]
  matrix: { cols: number; data: Node[] }
  brack: { lhs: ParenLhs; rhs: ParenRhs; contents: Leaf }
  sqrt: { contents: Node }
  nthroot: { root: Node; contents: Node }
  call: { name: string; arg: Node }
  mixedNumber: { int: string; num: string; denom: string }
  combination: [Node, Node]
  piecewise: { condition: Node | null; value: Node }
  text: string
}

export interface Prefix {
  op: string
  big: { kind: "sum" | "prod" | "int"; sup: Node | null; sub: Node | null }
  derivative: { name: string }
}

export interface Suffix {
  factorial: null
  exponent: Node
  property: { name: string }
  method: { name: string; arg: Node }
  index: Node
}

export interface Infix {
  juxtaposition: null
  op: string
}

export interface Bracket {
  paren: null
}

export type PrefixInfix = {
  [K in keyof Prefix & keyof Infix]: Prefix[K] & Infix[K]
}

export type Data<T> = { [K in keyof T]: { type: K; data: T[K] } }[keyof T]

export const Empty = 0
export const Leaf = 1
export const Prefix = 2
export const Suffix = 3
export const Infix = 4
export const PrxIfx = 5
export const Bracket = 7

export interface IRPrefix {
  type: typeof Prefix
  val: Data<Prefix>
  fl: number
  fr: number
}

export interface IRSuffix {
  type: typeof Suffix
  val: Data<Suffix>
  p: number
  /**
   * If present, this suffix is treated like a left-hand bracket, and a matching
   * IRBracket will be expected to follow.
   */
  matches?(bracket: IRBracket): boolean
}

export interface IRInfix {
  type: typeof Infix
  val: Data<Infix>
  il: number
  ir: number
  ir0?: number
}

export interface IRPrefixInfix {
  type: typeof PrxIfx
  val: Data<PrefixInfix>
  il: number
  ir: number
  fl: number
  fr: number
  ir0?: number
}

export interface IRBracket {
  type: typeof Bracket
  val: Data<Bracket>
  /**
   * If absent, this is a right-hand-only bracket. If present, this is a
   * left-hand bracket, and the function checks if it matches an opposing
   * bracket.
   */
  matches?(other: IRBracket): boolean
}

export type IR =
  | { type: typeof Leaf; val: Data<Leaf> }
  | IRPrefix
  | IRSuffix
  | IRInfix
  | IRPrefixInfix
  | IRBracket

export type IR2Node = { val: Node; p: IRPrefix[]; s: IRSuffix[] }

export type Node = Item
