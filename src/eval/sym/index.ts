import type { Cursor } from "../../field/model"
import type { Fn } from "../ops"
import type { JsValue } from "../ty"

export interface Syms {
  var: { id: string }
  call: { fn: Fn; args: Sym[] }
  undef: {}
  js: { value: JsValue }
}

export type SymName = keyof Syms
export type Sym = { [K in SymName]: { type: K } & Syms[K] }[SymName]

/**
 * Precedence is annoying. First, `∑f(x)` has a different precedence on its LHS
 * and RHS (concatenating with a variable on the LHS is fine; on the right, it's
 * not).
 */
export interface Precedence {
  readonly lhs: number
  readonly rhs: number
}

export interface TxrSym<T> {
  display(at: Cursor, value: T): Precedence
  deriv(value: T, wrt: string): Sym
  uses(name: string): boolean
  layer?: number
}

export const TXR_SYM: { [K in keyof Syms]?: TxrSym<Syms[K]> } =
  Object.create(null)
