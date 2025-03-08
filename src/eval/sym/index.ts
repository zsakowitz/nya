import type { WordKind } from "../../field/cmd/leaf/var"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R, type Command, type Cursor } from "../../field/model"
import type { Fn } from "../ops"
import type { DerivFn, DisplayFn } from "../ops/dist-manual"
import type { JsValue } from "../ty"
import { real } from "../ty/create"

export interface SymVarSource {
  name: string
  kind: Exclude<WordKind, "magicprefix"> | undefined
  italic: boolean
  sub?: string
}

// This is an intentionally short list. Most more complicated stuff can be
// expressed with `call`, and other things can just become packages.
export interface Syms {
  var: { id: string; source: SymVarSource }
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

/** Inclusionary comparison performed on `lhs` and `rhs`. */
export function insert(
  at: Cursor,
  result: SymDisplay,
  lhs: number,
  rhs: number,
) {
  if (result.lhs <= lhs || result.rhs <= rhs) {
    new CmdBrack("(", ")", null, result.block).insertAt(at, L)
  } else {
    result.block.insertAt(at, L)
  }
}

/** Exclusionary comparison performed on `lhs` and `rhs`. */
export function insertStrict(
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

export function prefixFn(op: () => Command, prec: number): DisplayFn {
  return ([a, b]) => {
    if (!a || b) return
    const block = new Block(null)
    const cursor = block.cursor(R)
    op().insertAt(cursor, L)
    insert(cursor, txr(a).display(a), prec, prec)
    return { block, lhs: prec, rhs: prec }
  }
}

export function binaryFn(op: () => Command | Block, prec: number): DisplayFn {
  return ([a, b, c]) => {
    if (!(a && b && !c)) return
    const block = new Block(null)
    const cursor = block.cursor(R)
    insert(cursor, txr(a).display(a), prec, prec)
    op().insertAt(cursor, L)
    insert(cursor, txr(b).display(b), prec, prec)
    return { block, lhs: prec, rhs: prec }
  }
}

export function unary(f: (wrt: string, a: Sym) => Sym): DerivFn {
  return ([a, b], wrt) => {
    if (!a || b) {
      throw new Error("Incorrect number of arguments passed to function.")
    }

    return f(wrt, a)
  }
}

export function binary(f: (wrt: string, a: Sym, b: Sym) => Sym): DerivFn {
  return ([a, b, c], wrt) => {
    if (!a || !b || c) {
      throw new Error("Incorrect number of arguments passed to function.")
    }

    return f(wrt, a, b)
  }
}

export const SYM_0: Sym = {
  type: "js",
  value: { type: "r32", list: false, value: real(0) },
}

export const SYM_1: Sym = {
  type: "js",
  value: { type: "r32", list: false, value: real(1) },
}
