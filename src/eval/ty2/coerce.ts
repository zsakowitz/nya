import type { Ty, TyName, Type } from "."
import { list } from "../ty"
import { TY_INFO } from "./info"

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

/** Useful for piecewise-like functions. */
export function coerceType(types: readonly Type[]): Type {
  // Also covers the .length == 0 case
  if (types.every((x) => x.list === false)) {
    return { type: coerceTy(types), list: false }
  }

  // Like for empty lists, it doesn't matter what we pick
  if (types.some((x) => x.list === 0)) {
    return { type: "bool", list: 0 }
  }

  return {
    type: coerceTy(types),
    list: types.reduce(
      (a, b) => Math.min(a, b.list === false ? 1 : b.list),
      Infinity,
    ),
  }
}
