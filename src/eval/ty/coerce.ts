import {
  listTy,
  tyToGlsl,
  type GlslVal,
  type GlslValue,
  type JsVal,
  type JsValList,
  type JsValue,
  type Ty,
  type TyName,
  type Type,
} from "."
import type { GlslContext } from "../fn"
import { pt, real } from "./create"
import { garbageValJs } from "./garbage"

/**
 * `null` means there were zero arguments. Any other coercion error will be
 * thrown.
 */
export function coerceTy(tys: Ty[]): Ty | null {
  if (!tys.length) {
    return null
  }

  const encountered: Partial<Record<TyName, number>> = Object.create(null)

  for (const ty of tys) {
    encountered[ty.type] = (encountered[ty.type] || 0) + 1
  }

  if (Object.keys(encountered).length == 1) {
    return { type: Object.keys(encountered)[0] as TyName }
  }

  if (encountered.real && !encountered.complex && !encountered.color) {
    return { type: "real" }
  }

  if (encountered.complex && !encountered.color) {
    return { type: "complex" }
  }

  throw new Error(`Cannot coerce ${listTy(tys)}.`)
}

export function coerceValJs(val: JsVal, to: Ty): JsVal {
  if (val.type == to.type) {
    return val
  }

  if (val.type == "bool" && to.type == "real") {
    if (val.value) {
      return { type: "real", value: real(1) }
    } else {
      return garbageValJs(to)
    }
  }

  if (val.type == "bool" && to.type == "complex") {
    if (val.value) {
      return { type: "complex", value: pt(real(1), real(0)) }
    } else {
      return garbageValJs(to)
    }
  }

  if (val.type == "real" && to.type == "complex") {
    return {
      type: "complex",
      value: { type: "point", x: val.value, y: real(0) },
    }
  }

  throw new Error(`Cannot coerce ${val.type} to ${to}.`)
}

export function coerceValGlsl(val: GlslVal, to: Ty): string {
  if (val.type == to.type) {
    return val.expr
  }

  if (val.type == "bool" && to.type == "real") {
    return `(${val.expr} ? 1.0 : 0.0/0.0)`
  }

  if (val.type == "bool" && to.type == "complex") {
    return `(${val.expr} ? vec2(1, 0) : vec2(0.0/0.0))`
  }

  if (val.type == "real" && to.type == "complex") {
    return `vec2(${val.expr}, 0)`
  }

  throw new Error(`Cannot coerce ${val.type} to ${to}.`)
}

export function listJs(vals: JsVal[]): JsValList {
  if (vals.length == 0) {
    return { type: "real", list: true, value: [] }
  }

  const ty = coerceTy(vals)!

  return {
    type: ty.type,
    list: true,
    value: vals.map(
      (val) => coerceValJs(val, ty).value,
    ) satisfies JsVal["value"][] as any,
  }
}

export function listGlsl(ctx: GlslContext, vals: GlslVal[]): GlslValue {
  const name = ctx.name()

  if (vals.length == 0) {
    ctx.push`float ${name}[0];\n`
    return { type: "real", list: 0, expr: name }
  }

  const ty = coerceTy(vals)!
  ctx.push`${tyToGlsl(ty)} ${name}[${vals.length}];\n`

  for (let i = 0; i < vals.length; i++) {
    ctx.push`${name}[${i}] = ${coerceValGlsl(vals[i]!, ty)};\n`
  }

  return { type: ty.type, list: vals.length, expr: name }
}

/**
 * `null` means there were zero arguments. Any other coercion error will be
 * thrown.
 */
export function coerceType(types: Type[]): Type | null {
  if (!types.length) {
    return null
  }

  const ty = coerceTy(types.filter((x) => x.list !== 0))!

  // Everything is length zero, so we can pick any type
  if (ty == null) {
    return { list: 0, type: types[0]!.type }
  }

  if (types.every((x) => x.list === false)) {
    return { list: false, type: ty.type }
  }

  // Non-lists get coerced to lists of length 1
  const lens = types.map((x) => (x.list === false ? 1 : x.list))

  return {
    list: Math.min(...lens),
    type: ty.type,
  }
}

export function coerceValueJs(value: JsValue, to: Type): JsValue {
  if (to.list === false) {
    if (value.list) {
      throw new Error("Cannot coerce from a list to a non-list.")
    }

    return { ...coerceValJs(value, to), list: false }
  }

  if (to.list === 0) {
    return { list: true, type: to.type, value: [] }
  }

  const values = value.list ? value.value : [value.value]

  return {
    ...to,
    value: values
      .slice(0, to.list)
      .map(
        (item) =>
          coerceValJs({ type: value.type, value: item } as any, to).value,
      ),
  } as any
}

export function coerceValueGlsl(
  ctx: GlslContext,
  value: GlslValue,
  to: Type,
): string {
  if (to.list === false) {
    if (value.list !== false) {
      throw new Error("Cannot coerce from a list to a non-list.")
    }

    return coerceValGlsl(value, to)
  }

  if (to.list === 0) {
    return "[]"
  }

  if (value.list === false) {
    if (to.list === 1) {
      return `[${coerceValGlsl(value, to)}]`
    }

    throw new Error("Cannot grow a list.")
  }

  return ctx.map(value as any, to, (item) =>
    coerceValGlsl({ expr: item, type: value.type }, to),
  )
}
