import type { SReal } from "."
import { safe } from "../lib/util"
import { isZero } from "./check"
import { approx, frac, num, real } from "./create"

export function add(a: SReal, b: SReal) {
  a: if (a.type == "exact" && b.type == "exact") {
    const s1 = a.n * b.d
    if (!safe(s1)) break a
    const s2 = b.n * a.d
    if (!safe(s2)) break a
    const s3 = a.d * b.d
    if (!safe(s3)) break a
    const s4 = s1 + s2
    if (!safe(s4)) break a
    return frac(s4, s3)
  }

  return approx(num(a) + num(b))
}

export function mul(a: SReal, b: SReal) {
  a: if (a.type == "exact" && b.type == "exact") {
    const s1 = a.n * b.n
    if (!safe(s1)) break a
    const s2 = b.d * a.d
    if (!safe(s2)) break a
    return frac(s1, s2)
  }

  return approx(num(a) * num(b))
}

export function neg(a: SReal): SReal {
  return a.type == "exact" ? frac(-a.n, a.d) : approx(-a.value)
}

export function raise(a: SReal, b: SReal): SReal {
  if (isZero(b)) {
    return real(1)
  }

  if (isZero(a)) {
    const bv = num(b)
    if (isNaN(bv)) {
      return real(NaN)
    } else if (bv < 0) {
      return real(Infinity)
    } else if (bv == 0) {
      return real(1)
    } else {
      return real(0)
    }
  }

  if (a.type == "exact") {
    const n = a.n ** num(b)
    const d = a.d ** num(b)
    if (safe(n) && safe(d)) return frac(n, d)
  }

  // TODO: things like (-8) ** (1/3) don't work
  // TODO: use approx and exact better
  return real(num(a) ** num(b))
}

export function sub(a: SReal, b: SReal) {
  a: if (a.type == "exact" && b.type == "exact") {
    const s1 = a.n * b.d
    if (!safe(s1)) break a
    const s2 = b.n * a.d
    if (!safe(s2)) break a
    const s3 = a.d * b.d
    if (!safe(s3)) break a
    const s4 = s1 - s2
    if (!safe(s4)) break a
    return frac(s4, s3)
  }

  return approx(num(a) - num(b))
}

export function recip(a: SReal): SReal {
  if (a.type == "exact") {
    if (a.d != 0) {
      return frac(a.d, a.n)
    }
  }

  return approx(1 / num(a))
}

export function div(a: SReal, b: SReal): SReal {
  a: if (a.type == "exact" && b.type == "exact") {
    const s1 = a.n * b.d
    if (!safe(s1)) break a
    const s2 = b.n * a.d
    if (!safe(s2)) break a
    return frac(s1, s2)
  }

  return approx(num(a) / num(b))
}

export function abs(v: SReal): SReal {
  if (v.type == "exact") {
    return frac(Math.abs(v.n), v.d)
  } else {
    return approx(Math.abs(v.value))
  }
}
