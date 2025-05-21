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
  op: { name: string }
  integral: { sup: Node | null; sub: Node | null }
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
  op: { name: string }
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

type PrxIfx = typeof Prefix | typeof Infix | typeof PrxIfx

export type IR =
  | { type: typeof Leaf; val: Node }
  | { type: typeof Prefix; val: Data<Prefix>; p: number }
  | { type: typeof Suffix; val: Data<Suffix> }
  | { type: typeof Infix; val: Data<Infix>; p: number }
  | { type: PrxIfx; val: Data<PrefixInfix>; p: number }

export type Node =
  | { type: typeof Empty }
  | { type: typeof Leaf; val: Data<Leaf> }
  | { type: typeof Prefix; via: Data<Prefix>; on: Node }
  | { type: typeof Suffix; via: Data<Suffix>; on: Node }
  | { type: typeof Infix; via: Data<Infix>; lhs: Node; rhs: Node }

// Higher precedence is tighter
