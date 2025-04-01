import { CmdNum } from "@/field/cmd/leaf/num"
import { Op } from "@/field/cmd/leaf/op"
import type { WordKind } from "@/field/cmd/leaf/var"
import { CmdBrack } from "@/field/cmd/math/brack"
import { Block, L, R, type Command, type Cursor } from "@/field/model"
import type { ImageData } from "@/pkg/image"
import type { Deps } from "../deps"
import type { PropsGlsl } from "../glsl"
import type { PropsJs } from "../js"
import { id } from "../lib/binding"
import type { Fn } from "../ops"
import type { DerivFn, DisplayFn } from "../ops/dist-manual"
import type {
  GlslValue,
  JsValue,
  SColor,
  SPoint,
  SReal,
  TyName,
  Tys,
  Val,
} from "../ty"
import { frac, real } from "../ty/create"
import { TY_INFO, type TyInfo } from "../ty/info"

interface SymVarSource {
  name: string
  kind: Exclude<WordKind, "magicprefix" | "magicprefixword"> | undefined
  italic: boolean
  sub?: string
}

// This is an intentionally short list. Most more complicated stuff can be
// expressed with `call`, and other things can just become packages.
export interface Syms {
  var: { id: string; source: SymVarSource }
  call: { fn: Fn; args: Sym[] }
  dep: { id: string; value: Sym }
  undef: {}
  js: { value: JsValue }
  val: { value: SymVal }
}

type AsSym<T> =
  T extends string | ImageData | null | undefined ? T
  : T extends SReal | boolean | number | Sym ? Sym
  : T extends SPoint ? [Sym, Sym]
  : T extends SColor ? [Sym, Sym, Sym, Sym]
  : { [K in keyof T]: AsSym<T[K]> }

export type TysSym = { [K in keyof Tys]: AsSym<Tys[K]> }
export type SymVal = {
  [K in keyof TysSym]:
    | { type: K; list: false; value: TysSym[K] }
    | { type: K; list: number; value: TysSym[K][] }
}[keyof TysSym]

export type SymName = keyof Syms

export type Sym<T extends SymName = SymName> = {
  [K in T]: { type: K } & Syms[K]
}[T]

// SHAPE:
export interface TxrSym<T> {
  display(value: T): SymDisplay
  deriv(value: T, wrt: string): Sym
  uses(value: T, name: string): boolean
  simplify(value: T): Sym
  layer?: number

  deps(value: T, deps: Deps): void
  js(value: T, props: PropsJs): JsValue
  glsl(value: T, props: PropsGlsl): GlslValue
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
  if (
    result.lhs <= lhs ||
    result.rhs <= rhs ||
    (at[L] && !(at[L] instanceof Op) && result.block.ends[L] instanceof CmdNum)
  ) {
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
  if (
    result.lhs < lhs ||
    result.rhs < rhs ||
    (at[L] && !(at[L] instanceof Op) && result.block.ends[L] instanceof CmdNum)
  ) {
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

export function suffixFn(op: () => Command, prec: number): DisplayFn {
  return ([a, b]) => {
    if (!a || b) return
    const block = new Block(null)
    const cursor = block.cursor(R)
    insert(cursor, txr(a).display(a), prec, prec)
    op().insertAt(cursor, L)
    return { block, lhs: prec, rhs: prec }
  }
}

export function binaryFn(op: () => Command | Block, prec: number): DisplayFn {
  return ([a, b, c]) => {
    if (!(a && b && !c)) return
    const block = new Block(null)
    const cursor = block.cursor(R)
    insertStrict(cursor, txr(a).display(a), prec, prec)
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

export const SYM_FALSE: Sym = {
  type: "js",
  value: { type: "bool", list: false, value: false },
}

export const SYM_TRUE: Sym = {
  type: "js",
  value: { type: "bool", list: false, value: true },
}

export const SYM_2: Sym = {
  type: "js",
  value: { type: "r32", list: false, value: real(2) },
}

export const SYM_HALF: Sym = {
  type: "js",
  value: { type: "r32", list: false, value: frac(1, 2) },
}

export const SYM_PI: Sym = {
  type: "var",
  id: id({ value: "π" }),
  source: { italic: false, kind: "var", name: "π" },
}

export const SYM_E: Sym = {
  type: "var",
  id: id({ value: "e" }),
  source: { italic: true, kind: "var", name: "e" },
}

export function isZero(sym: Sym) {
  return !!(
    sym.type == "js" &&
    sym.value.list === false &&
    (TY_INFO[sym.value.type] as TyInfo<Val, TyName>).extras?.isZero?.(
      sym.value.value,
    )
  )
}

export function isOne(sym: Sym) {
  return !!(
    sym.type == "js" &&
    sym.value.list === false &&
    (TY_INFO[sym.value.type] as TyInfo<Val, TyName>).extras?.isOne?.(
      sym.value.value,
    )
  )
}

export function asBool(sym: Sym) {
  return (
    (sym.type == "js" && sym.value.list === false ?
      (TY_INFO[sym.value.type] as TyInfo<Val, TyName>).extras?.asBool?.(
        sym.value.value,
      )
    : null) ?? null
  )
}
