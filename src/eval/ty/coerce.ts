import type {
  GlslVal,
  GlslValue,
  JsVal,
  JsValue,
  List,
  Ty,
  TyName,
  Type,
  Val,
} from "."
import { list } from "."
import type { GlslContext } from "../lib/fn"
import { TY_INFO, type TyCoerce, type TyCoerceMap } from "./info"

export function canCoerce(src: TyName, dst: TyName): boolean {
  return src == dst || {}.hasOwnProperty.call(TY_INFO[src].coerce, dst)
}

/** Useful for assembling lists. */
export function coerceTy(tys: readonly Ty[]): TyName {
  // We need to pick *something*, so why not "bool"?
  // Could make a special "never" type, but it seems so useless.
  if (tys.length == 0) {
    return "bool"
  }

  const possible = Object.create(null)

  for (const ty of tys) {
    possible[ty.type] = (possible[ty.type] || 0) + 1
    for (const coerce in TY_INFO[ty.type]) {
      possible[coerce] = (possible[coerce] || 0) + 1
    }
  }

  for (const key in possible) {
    if (possible[key] == tys.length) {
      return key as TyName
    }
  }

  throw new Error(
    `Cannot coerce ${list(tys.map((x) => TY_INFO[x.type].name))}.`,
  )
}

export function listJs(vals: JsValue[]): JsValue {
  if (!vals.every((x) => x.list === false)) {
    throw new Error("Cannot store lists inside other lists.")
  }

  const type = coerceTy(vals)

  return {
    type,
    list: vals.length,
    value: vals.map((x) =>
      x.type == type ?
        x.value
      : (TY_INFO[x.type].coerce as TyCoerceMap<Val>)[type]!.js(x.value),
    ),
  }
}

export function listGlsl(ctx: GlslContext, vals: GlslValue[]): GlslValue {
  if (!vals.every((x) => x.list === false)) {
    throw new Error("Cannot store lists inside other lists.")
  }

  const type = coerceTy(vals)
  const ret = ctx.name()
  ctx.push`${TY_INFO[type].glsl} ${ret}[${vals.length}];\n`

  for (let i = 0; i < vals.length; i++) {
    ctx.push`${ret}[${i}] = ${coerceValGlsl(ctx, vals[i]!, type).expr};\n`
  }

  return { type, list: vals.length, expr: ret }
}

/** Useful for distributing across lists. */
export function unifyLists(types: readonly List[]): number | false {
  // Also covers the .length == 0 case
  if (types.every((x) => x.list === false)) {
    return false
  }

  // Like for empty lists, it doesn't matter what we pick
  if (types.some((x) => x.list === 0)) {
    return 0
  }

  return types.reduce(
    (a, b) => Math.min(a, b.list === false ? Infinity : b.list),
    Infinity,
  )
}

/** Useful for piecewise-like functions. */
export function coerceType(types: readonly Type[]): Type {
  return {
    type: coerceTy(types),
    list: unifyLists(types),
  }
}

export function coerceValJs<T extends TyName>(val: JsVal, to: T): JsVal<T>
export function coerceValJs(val: JsVal, to: TyName): JsVal {
  if (val.type == to) {
    return val
  }

  const coercion: TyCoerce<Val, Val> | undefined = TY_INFO[val.type].coerce[to]

  if (!coercion) {
    throw new Error(
      `Cannot coerce from ${TY_INFO[val.type].name} to ${TY_INFO[to].name}.`,
    )
  }

  return {
    type: to,
    value: coercion.js(val.value),
  }
}

export function coerceValGlsl(
  ctx: GlslContext,
  val: GlslVal,
  to: TyName,
): GlslVal {
  if (val.type == to) {
    return val
  }

  const coercion: TyCoerce<Val, Val> | undefined = TY_INFO[val.type].coerce[to]

  if (!coercion) {
    throw new Error(
      `Cannot coerce from ${TY_INFO[val.type].name} to ${TY_INFO[to].name}.`,
    )
  }

  return {
    type: to,
    expr: coercion.glsl(val.expr, ctx),
  }
}

export function coerceValueJs<T extends TyName = TyName>(
  value: JsValue,
  to: Type<T>,
): JsValue<T>
export function coerceValueJs(value: JsValue, to: Type): JsValue {
  if (to.list === false) {
    if (value.list !== false) {
      throw new Error("Cannot coerce from a list to a non-list.")
    }

    return { ...coerceValJs(value, to.type), list: false }
  }

  if (to.list === 0) {
    return {
      type: to.type,
      list: 0,
      value: [],
    }
  }

  if (value.list === false) {
    if (to.list === 1) {
      return {
        type: to.type,
        list: 1,
        value: [coerceValJs(value, to.type).value],
      }
    }

    throw new Error("Cannot grow a list.")
  }

  return {
    type: to.type,
    list: to.list,
    value: value.value.map(
      (val) => coerceValJs({ value: val, type: value.type }, to.type).value,
    ),
  }
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

    return coerceValGlsl(ctx, value, to.type).expr
  }

  const ret = ctx.name()
  ctx.push`${TY_INFO[to.type].glsl} ${ret}[${to.list}];\n`

  if (to.list === 0) {
    return ret
  }

  if (value.list === false) {
    if (to.list === 1) {
      ctx.push`${ret}[0] = ${coerceValGlsl(ctx, value, to.type).expr};\n`
      return ret
    }

    throw new Error("Cannot grow a list.")
  }

  const index = ctx.name()
  const cached = ctx.cache(value)
  ctx.push`for (int ${index} = 0; ${index} < ${to.list}; ${index}++) {\n`
  ctx.push`${ret}[${index}] = ${
    coerceValGlsl(
      ctx,
      { expr: `${cached}[${index}]`, type: value.type },
      to.type,
    ).expr
  };`
  ctx.push`}\n`

  return ret
}

export function isReal(val: JsVal): val is JsVal<"r32" | "r64">
export function isReal(val: GlslVal): val is GlslVal<"r32" | "r64">
export function isReal(val: { type: unknown }): val is { type: "r32" | "r64" } {
  return val.type === "r32" || val.type === "r64"
}
