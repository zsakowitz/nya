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
import type { GlslContext } from "../fn"
import { list } from "../ty"
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
      (TY_INFO[x.type].coerce as TyCoerceMap<Val>)[type]!.js(x.value),
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

export function isReal(val: JsVal): val is JsVal<"r32" | "r64">
export function isReal(val: GlslVal): val is GlslVal<"r32" | "r64">
export function isReal(val: { type: unknown }): val is { type: "r32" | "r64" } {
  return val.type === "r32" || val.type === "r64"
}
