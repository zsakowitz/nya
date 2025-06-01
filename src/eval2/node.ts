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
import { Precedence } from "./prec"

export type Keyed<T> = { [K in keyof T]: { type: K; data: T[K] } }[keyof T]

export type Name = { name: string; sub: Node | null }

export interface OpKind {
  num: string
  num16: string
  uvar: Name // name of a user-defined variable
  bvar: Name // name of a builtin variable
  ucall: { name: Name; arg: Node } // call of a user-defined function (not min, max, sin, etc.)
  bcall: { name: Name; arg: Node | null } // call of a builtin function
  frac: [Node, Node]
  matrix: { cols: number; data: Node[] }
  group: { lhs: ParenLhs; rhs: ParenRhs; contents: Node }
  sqrt: Node
  nthroot: { root: Node; contents: Node }
  mixed: { int: string; num: string; denom: string }
  combination: [Node, Node]
  piecewise: { condition: Node | null; value: Node }[]
  text: string
  op: string
  big: { kind: string; sup: Node | null; sub: Node | null }
  derivative: Name
  suffix: Suffix[]
  binding: { name: Name; args: Node | null }
  /** Operator arguments are used as list contents. */
  list: null
}

export interface SuffixKind {
  factorial: null
  exponent: Node
  property: { name: Name }
  method: { name: Name; arg: Node }
  index: Node
}

export type Suffix = Keyed<SuffixKind>

export type Data = Keyed<OpKind>

// Useful aliases
export interface Node extends ParseNode<Data> {}
export const IR = ParseIR<Data>
export type IR = ParseIR<Data>
export const leaf = pLeaf<Data>
export const prfx = pPrfx<Data>
export const sufx = pSufx<Data>
export const infx = pInfx<Data>
export const pifx = pPifx<Data>

/**
 * COMPAT: Our precedence for the juxtapose operator is higher than Desmos's
 * under certain circumstances.
 *
 * In Desmos syntax, possible function calls always have highest possible
 * precedence, exceeding that of every other operator except a single suffix (²,
 * !, [3], etc.). This means `2 ÷ 3(4)` and `2 ÷ a(4) with a=3` evaluate to
 * different things in Desmos, since the first is interpreted as `(2 / 3) * 4`,
 * whereas the second is `2 / (call 3 4)`.
 *
 * This is fixable by evaluating `2 ÷ a(b)` as its own special kind of node, but
 * this requires also adding `2 ÷ a(b)²` as another special kind. In Desmos,
 * this is an acceptable cost, but in project nya, we allow arbitrary operator
 * precedences, and even include the `↑` operator for exponentiation. This means
 * chains like `2 ÷ 3 ↑ a(b)` become totally different depending on whether `a`
 * is a function or variable, in ways that are difficult to generalize. As a
 * result, we'll just let `a(b)` always have higher precedence than `a*b`, even
 * though it partially conflicts with Desmos and definitely conflicts with
 * Wolfram|Alpha.
 *
 * This also makes it so whitespace more consistently delineates subparts of
 * expressions. Since the division sign is displayed with spaces around it,
 * common UI rules would dictate that `2 ÷ 3(4)` should evaluate `3(4)`
 * separately from `2`, then perform division. The spacing in the nya math
 * editor coupled with a short explanation in the docs should remedy any damage
 * caused by incongruence with Desmos's syntax.
 *
 * At any rate, compatibility with Desmos or Wolfram|Alpha is no longer a
 * possible goal. The `mod` operator works differently than Desmos's `mod`
 * function, and `2.sin` will either be banned or work differently.
 */
export const JUXTAPOSE_TOKEN = infx(
  { type: "op", data: "%juxtapose" },
  Precedence.JuxtaposeL,
  Precedence.JuxtaposeR,
)
