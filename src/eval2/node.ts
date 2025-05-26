import type { ParenLhs, ParenRhs } from "@/field/cmd/math/brack"
import {
  ParseIR,
  pInfx,
  pLeaf,
  pPifx,
  pPrfx,
  pSufx,
  type ParseNode,
} from "./parse"

export type Keyed<T> = { [K in keyof T]: { type: K; data: T[K] } }[keyof T]

export interface OpKind {
  num: string
  num16: string
  frac: [Node, Node]
  matrix: { cols: number; data: Node[] }
  brack: { lhs: ParenLhs; rhs: ParenRhs; contents: Node }
  sqrt: { contents: Node }
  nthroot: { root: Node; contents: Node }
  call: { name: string; arg: Node }
  mixed: { int: string; num: string; denom: string }
  combination: [Node, Node]
  piecewise: { condition: Node | null; value: Node }
  text: string
  op: string
  big: { kind: "sum" | "prod" | "int"; sup: Node | null; sub: Node | null }
  derivative: { name: string }
  suffix: Suffix[]
}

export interface SuffixKind {
  factorial: null
  exponent: Node
  property: { name: string }
  method: { name: string; arg: Node }
  index: Node
}

export type Suffix = Keyed<SuffixKind>

export type Data = Keyed<OpKind>

// Useful aliases
export interface Node extends ParseNode<Data> {}
export const IR = ParseIR<Data>
export const leaf = pLeaf<Data>
export const prfx = pPrfx<Data>
export const sufx = pSufx<Data>
export const infx = pInfx<Data>
export const pifx = pPifx<Data>
