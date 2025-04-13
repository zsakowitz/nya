import type { GlslContext } from "../lib/fn"
import { unifyLists } from "./coerce"
import { TY_INFO } from "./info"

/**
 * Augment this interface to declare additional types.
 *
 * Be sure to also extend the `TY_INFO` variable.
 */
export interface Tys {
  never: "__never"
  r32: SReal
  r64: SReal
  bool: boolean
  point32: SPoint
}

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

export interface GlslUniform<
  T extends TyName = TyName,
  L extends number | false = number | false,
> extends Type<T, L> {}

export function each<T extends TyName>(value: JsValue<T>): Tys[T][] {
  return value.list === false ? [value.value] : value.value
}

export function map<
  T extends TyName,
  U extends TyName,
  L extends number | false,
>(
  value: JsValue<T, L>,
  type: U,
  map: (value: Val<T>) => Tys[U],
): JsValue<U, L> {
  if (value.list === false) {
    return {
      type,
      list: false,
      value: map(value.value),
    } satisfies JsValue<U, false> as any
  }

  return {
    type,
    list: value.list,
    value: value.value.map(map),
  } satisfies JsValue<U, number> as any
}

export function join<const T extends readonly JsValue[], U extends TyName>(
  values: T,
  ret: U,
  map: (...args: { [K in keyof T]: JsVal<T[K]["type"]> }) => Val<U>,
): JsValue<U>

export function join(
  values: JsValue[],
  type: TyName,
  map: (...args: JsVal[]) => Val,
): JsValue {
  const list = unifyLists(values)

  if (list === false) {
    return {
      list: false,
      type,
      value: map(...(values as JsVal[])),
    }
  }

  return {
    list,
    type,
    value: Array.from({ length: list }, (_, j) =>
      map(
        ...values.map((x) =>
          x.list === false ? x : { type: x.type, value: x.value[j]! },
        ),
      ),
    ),
  }
}

export function joinGlsl<
  const T extends readonly GlslValue[],
  U extends TyName,
>(
  ctx: GlslContext,
  values: T,
  ret: U,
  map: (...args: { [K in keyof T]: GlslVal<T[K]["type"]> }) => string,
): GlslValue<U>

export function joinGlsl(
  ctx: GlslContext,
  values: GlslValue[],
  type: TyName,
  map: (...args: GlslVal[]) => string,
): GlslValue {
  const list = unifyLists(values)

  if (list === false) {
    return {
      list: false,
      type,
      expr: map(...(values as GlslVal[])),
    }
  }

  const expr = ctx.name()
  ctx.push`${TY_INFO[type].glsl} ${expr}[${list}];\n`
  const args = values.map((x) => ({ ...x, expr: ctx.cacheValue(x) }))
  const index = ctx.name()
  ctx.push`for (int ${index} = 0; ${index} < ${list}; ${index}++) {\n`
  ctx.push`${expr}[${index}] = ${map(
    ...args.map((x) =>
      x.list === false ? x : { type: x.type, expr: `${x.expr}[${index}]` },
    ),
  )};\n`
  ctx.push`}\n`

  return { list, type, expr }
}

export function typeName(type: Type) {
  if (type.list === false) {
    return TY_INFO[type.type].name
  } else if (type.list === 0 && type.type == "never") {
    return "empty list"
  } else {
    return `list of ${type.list} ${
      type.list === 1 ? TY_INFO[type.type].name : TY_INFO[type.type].namePlural
    }`
  }
}
