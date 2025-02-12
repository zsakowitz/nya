/**
 * Augment this interface to declare additional types.
 *
 * Be sure to also extend the `TY_INFO` variable.
 */
export interface Tys {
  r32: SReal
  r64: SReal
  bool: boolean
  color: SColor
}

export type StrSegment = { type: "plain" | "latex"; value: string }

export interface TyComponents {
  r32: never
  r64: never
  bool: never
  color: "r32"
}

null! as TyComponents satisfies Record<TyName, TyName>

export type SApprox = { type: "approx"; value: number }
export type SExact = { type: "exact"; n: number; d: number }
export type SReal = SApprox | SExact

export type SPoint = { type: "point"; x: SReal; y: SReal }
export type SColor = { type: "color"; r: SReal; g: SReal; b: SReal; a: SReal }

export function list(values: string[], conj = "and"): string {
  if (values.length == 0) {
    return "nothing"
  }

  if (values.length == 1) {
    return values[0]!
  }

  if (values.length == 2) {
    return values[0]! + ` ${conj} ` + values[1]!
  }

  return (
    values.slice(0, -1).join(", ") + `, ${conj} ` + values[values.length - 1]!
  )
}

export type TyName = keyof Tys

export type Val<T extends TyName = TyName> = Tys[T]

export interface Ty<T extends TyName = TyName> {
  readonly type: T
}

export interface JsVal<T extends TyName = TyName> extends Ty<T> {
  readonly value: Tys[T]
}

export interface GlslVal<T extends TyName = TyName> extends Ty<T> {
  readonly expr: string
}

export interface List<L extends number | false = number | false> {
  readonly list: L
}

export interface Type<
  T extends TyName = TyName,
  L extends number | false = number | false,
> extends Ty<T>,
    List<L> {}

export type JsValue<
  T extends TyName = TyName,
  L extends number | false = number | false,
> =
  | (L extends false ? Type<T, L> & { value: Tys[T] } : never)
  | (L extends number ? Type<T, L> & { value: Tys[T][] } : never)

export interface GlslValue<
  T extends TyName = TyName,
  L extends number | false = number | false,
> extends Type<T, L> {
  readonly expr: string
}

export function each<T extends TyName>(value: JsValue<T>): Tys[T][] {
  return value.list === false ? [value.value] : value.value
}
