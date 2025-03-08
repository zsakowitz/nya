import { CmdBrack } from "../../field/cmd/math/brack"
import { L, type Block, type Cursor } from "../../field/model"
import type { Fn } from "../ops"
import type { JsValue } from "../ty"

// This is an intentionally short list. Most more complicated stuff can be
// expressed with `call`, and other things can just become packages.
export interface Syms {
  var: { id: string }
  call: { fn: Fn; args: Sym[] }
  undef: {}
  js: { value: JsValue }
}

export type SymName = keyof Syms

export type Sym<T extends SymName = SymName> = {
  [K in T]: { type: K } & Syms[K]
}[T]

export interface TxrSym<T> {
  display(value: T): SymDisplay
  deriv(value: T, wrt: string): Sym
  uses(value: T, name: string): boolean
  layer?: number
}

export const TXR_SYM: { [K in keyof Syms]?: TxrSym<Syms[K]> } =
  Object.create(null)

export function txr<T extends SymName>(sym: Sym<T>): TxrSym<Syms[T]> {
  const txr = TXR_SYM[sym.type]
  if (!txr) {
    throw new Error(`Symbolic expression type '${sym.type}' is not defined.`)
  }

  return txr
}

export interface SymDisplay {
  block: Block
  // Precedence is separate on LHS and RHS (reasons include: ∑)
  lhs: number
  rhs: number
}

/** Exclusionary comparison performed on `lhs` and `rhs`. */
export function insert(
  at: Cursor,
  result: SymDisplay,
  lhs: number,
  rhs: number,
) {
  if (result.lhs < lhs || result.rhs < rhs) {
    new CmdBrack("(", ")", null, result.block).insertAt(at, L)
  } else {
    result.block.insertAt(at, L)
  }
}
