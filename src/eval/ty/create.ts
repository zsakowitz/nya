import type { SApprox, SPoint, SReal } from "."
import type { Point } from "../../sheet/point"
import { safe } from "../lib/util"

export function num(value: SReal): number {
  if (value.type == "exact") {
    return value.n / value.d
  }

  return value.value
}

export function approx(value: number): SApprox {
  return { type: "approx", value }
}

function gcd(a: number, b: number) {
  for (let temp = b; b !== 0; ) {
    b = a % b
    a = temp
    temp = b
  }
  return a
}

export function frac(a: number, b: number): SReal {
  if (b == 0 || !safe(a) || !safe(b)) {
    return { type: "approx", value: a / b }
  }

  if (a == 0) {
    return { type: "exact", n: 0, d: 1 }
  }

  if (b < 0) {
    a = -a
    b = -b
  }

  const denom = gcd(a < 0 ? -a : a, b)
  return { type: "exact", n: a / denom, d: b / denom }
}

export function real(x: number): SReal {
  if (typeof x == "number") {
    if (safe(x)) {
      return { type: "exact", n: x, d: 1 }
    } else {
      return { type: "approx", value: x }
    }
  } else {
    return x
  }
}

export function pt(x: SReal, y: SReal): SPoint {
  return { type: "point", x, y }
}

export function unpt(pt: SPoint): Point {
  return { x: num(pt.x), y: num(pt.y) }
}

export function rept(pt: Point): SPoint {
  return { type: "point", x: real(pt.x), y: real(pt.y) }
}

export const SNANPT: SPoint = {
  type: "point",
  x: { type: "approx", value: NaN },
  y: { type: "approx", value: NaN },
}

export const NANPT: Point = { x: NaN, y: NaN }
