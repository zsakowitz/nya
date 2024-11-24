/*!
 * High-level IR
 *
 * The only step the HIR performs is monomorphization. Every user-defined
 * function is automatically generic over its input types (so that e.g. they may
 * work with a single point or a list of points), so we need to resolve this.
 *
 * At this level, everything is either a function call, a variable reference, or
 * a leaf node. A leaf node is like a number (something with an inherent type
 * which cannot be resolved any further), but may be generalized to support
 * other kinds of leaf nodes in the future.
 */

/** A map from the names of types to their abbreviations in GLSL. */
export const TYPE_MAP = {
  number: "n",
  point: "p",
}

/** A type a HIR node may have. */
export type Type = keyof typeof TYPE_MAP

/** An expression passed to the HIR pass. */
export type Expr =
  | { kind: "num"; value: number }
  | { kind: "var"; name: string | symbol }
  | { kind: "call"; name: string | symbol; args: Expr[] }

/** An expression returned by the HIR pass. */
export type Ret =
  | { kind: "num"; value: number }
  | { kind: "var"; name: string | symbol; tag: string }
  | { kind: "call"; name: string | symbol; tag: string; args: Expr[] }

export class Scope {
  readonly items: Record<string | symbol, Expr | (() => { 2 })>

  constructor(readonly parent?: Scope) {}
}
