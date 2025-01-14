import type { SColor, SPoint, SReal } from "../ty"

/**
 * Augment this interface to declare additional types.
 *
 * Be sure to also extend the `TY_INFO` variable.
 */
export interface TyNames {
  r32: SReal
  r64: SReal
  c32: SPoint
  c64: SPoint
  bool: boolean
  color: SColor
}

export type TyName = keyof TyNames

export interface Ty {
  readonly type: TyName
}

export interface Type extends Ty {
  readonly list: false | number
}

export interface JsValue extends Type {
  // Easier to do this than a union type, since we cast `as any` to avoid the
  // union type's annoyances in the current version anyway. Anything which
  // expects a particular type and wants to do it type-safely can just go
  // through a helper function.
  readonly value: TyNames[keyof TyNames]
}
