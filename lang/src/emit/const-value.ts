import { IdSource } from "./id"

export type ConstValue = number | boolean | readonly ConstValue[]

export function isConstValueEq(a: ConstValue, b: ConstValue): boolean {
  if (Array.isArray(a)) {
    if (!(Array.isArray(b) && a.length === b.length)) {
      return false
    }
  }

  return a === b
}

function constToStr(a: ConstValue): string {
  if (Array.isArray(a)) {
    let r = "["
    // 26% faster than .map.join; doesn't matter that much but nice anyway
    for (let i = 0; i < a.length; i++) {
      if (i != 0) r += ","
      r += constToStr(a[i]!)
    }
    r += "]"
    return r
  }
  return "" + a
}

const CONST_VAL_IDS = new IdSource()

export function hashConstValue(a: ConstValue) {
  return CONST_VAL_IDS.get(constToStr(a))
}
