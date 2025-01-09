import type { SApprox, SPoint, SReal } from "."

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
  if (b == 0) return { type: "approx", value: a / b }
  if (a == 0) return { type: "exact", n: 0, d: 1 }
  if (b < 0) {
    a = -a
    b = -b
  }
  const divBy = gcd(a < 0 ? -a : a, b)
  return { type: "exact", n: a / divBy, d: b / divBy }
}

export function safe(value: number) {
  return (
    typeof value == "number" &&
    value == Math.floor(value) &&
    Math.abs(value) < 0x20000000000000
  ) // 2 ** 53
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
