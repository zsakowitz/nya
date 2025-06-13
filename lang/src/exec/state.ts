import type { Node } from "@/eval2/node"
import type { NameIdent } from "@/eval2/tx"

export const enum Kind {
  Skip,
  Expr,
  Var,
  Fn,
}

export type VarData<T = Node> = { name: NameIdent; args: null; of: T }
export type FnData<T = Node> = { name: NameIdent; args: NameIdent[]; of: T }

/**
 * A consistent shape is used here for performance optimization, since these
 * objects are accessed frequently.
 */
export type State =
  // ok
  | { type: Kind.Skip; error: false; data: null } // ‹empty›
  | { type: Kind.Expr; error: false; data: Node } // 4+5
  | { type: Kind.Var; error: false; data: VarData } // a=2
  | { type: Kind.Fn; error: false; data: FnData } // f(x)=3x
  // err
  | { type: Kind.Expr; error: true; data: unknown } // 4+^7
  | { type: Kind.Var; error: true; data: VarData<unknown> } // a=3^
  | { type: Kind.Fn; error: true; data: FnData<unknown> } // f(x)=4+_3

/** Helper function to make consistent shape usage easier. */
export function ok(type: Kind.Expr, data: Node): State
export function ok(type: Kind.Var, data: VarData): State
export function ok(type: Kind.Fn, data: FnData): State
export function ok(type: any, data: any): State {
  return { type, error: false, data }
}

/** Helper function to make consistent shape usage easier. */
export function err(type: Kind.Expr, data: unknown): State
export function err(type: Kind.Var, data: VarData<unknown>): State
export function err(type: Kind.Fn, data: FnData<unknown>): State
export function err(type: any, data: any): State {
  return { type, error: true, data }
}

// Not frozen since that might change the shape or optimization possibilities.
export const SKIP: State = { type: Kind.Skip, error: false, data: null }

export interface Executable {
  args: NameIdent[]
  expr: string
}
