import type { SColor, SPoint, SReal } from "../ty"

/**
 * Augment this interface to declare additional types.
 *
 * Be sure to also extend the `TY_INFO` variable.
 */
export interface Tys {
  r32: SReal
  r64: SReal
  c32: SPoint
  c64: SPoint
  bool: boolean
  color: SColor
}

export type TyName = keyof Tys

export interface Ty<T extends TyName = TyName> {
  readonly type: T
}

export interface JsVal<T extends TyName = TyName> extends Ty<T> {
  readonly value: Tys[T]
}

export interface GlslVal<T extends TyName = TyName> extends Ty<T> {
  readonly expr: string
}

export interface Type<
  T extends TyName = TyName,
  L extends false | number = false | number,
> extends Ty<T> {
  readonly list: L
}

export type JsValue<T extends TyName = TyName> =
  | (Type<T, false> & { value: Tys[T] })
  | (Type<T, number> & { value: Tys[T][] })

export interface GlslValue<T extends TyName = TyName> extends Type<T> {
  readonly expr: string
}
