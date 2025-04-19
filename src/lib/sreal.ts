import { safe } from "@/eval/lib/util"

const { floor, ceil, round, sqrt, sign } = Math

export type SRealFrac = { n: number; d: number }

/**
 * A real number type which preserves exact values for fractions (0.1 is
 * represented as 1/10, not
 * `0.1000000000000000055511151231257827021181583404541015625`).
 *
 * In documentation, `n/d` is used to describe exact fractions, while `~n` is
 * used to describe approximate values, infinities, and NaN.
 */
export class SReal {
  private constructor(
    private readonly n: number,
    private readonly d: number | null,
  ) {}

  asFrac(): SRealFrac | null {
    if (this.d == null) {
      return null
    }
    return { n: this.n, d: this.d }
  }

  valueOf() {
    if (this.d === null) {
      return this.n
    } else {
      return this.n / this.d
    }
  }

  num() {
    return this.valueOf()
  }

  add(other: SReal): SReal {
    if (this.d === null || other.d === null) {
      return approx(this.n + other.n)
    }

    const a = this.n * other.d
    const b = other.n * this.d
    const c = a + b
    const d = this.d * other.d
    if (safe(a) && safe(b) && safe(c) && safe(d)) {
      return frac(c, d)
    }

    return approx(this.n + other.n)
  }

  sub(other: SReal): SReal {
    if (this.d === null || other.d === null) {
      return approx(this.n - other.n)
    }

    const a = this.n * other.d
    const b = other.n * this.d
    const c = a - b
    const d = this.d * other.d
    if (safe(a) && safe(b) && safe(c) && safe(d)) {
      return frac(c, d)
    }

    return approx(this.n + other.n)
  }

  mul(other: SReal): SReal {
    if (this.d === null || other.d === null) {
      return approx(this.n * other.n)
    }

    const a = this.n * other.n
    const b = this.d * other.d
    return frac(a, b)
  }

  div(other: SReal): SReal {
    if (this.d === null || other.d === null) {
      return approx(this.n * other.n)
    }

    const a = this.n * other.d
    const b = this.d * other.n
    return frac(a, b)
  }

  inv(): SReal {
    if (this.d === null) {
      return approx(1 / this.n)
    }

    return frac(this.d, this.n)
  }

  sqrt(): SReal {
    if (this.d !== null && this.d > 0 && this.n > 0) {
      const n = sqrt(this.n)
      const d = sqrt(this.d)
      if (safe(n) && safe(d)) {
        return frac(n, d)
      }
    }

    return approx(sqrt(this.num()))
  }

  abs(): SReal {
    return this.num() < 0 ? this.neg() : this
  }

  sign(): SReal {
    return int(sign(this.num()))
  }

  square(): SReal {
    if (this.d !== null) {
      const n = this.n * this.n
      const d = this.d * this.d
      if (safe(n) && safe(d)) {
        return frac(n, d)
      }
    }

    const n = this.num()
    return approx(n * n)
  }

  hypot2(other: SReal): SReal {
    return this.square().add(other.square())
  }

  hypot(other: SReal): SReal {
    return this.hypot2(other).sqrt()
  }

  neg(): SReal {
    if (this.d == null) {
      return approx(-this.n)
    }
    return frac(-this.n, this.d)
  }

  isApprox(): boolean {
    return this.d === null
  }

  gl32(): string {
    return this.num().toExponential()
  }

  gl64(): `vec2(${string})` {
    const n = this.num()
    FLOAT32[0] = n
    const a = FLOAT32[0]!
    const b = n - FLOAT32[0]!
    return `vec2(${a.toExponential()}, ${b.toExponential()})`
  }

  finite(): boolean {
    return isFinite(this.num())
  }

  zero() {
    return this.num() === 0
  }

  pow(b: SReal): SReal {
    const a = this
    const bv = b.num()

    if (b.zero()) {
      return int(1)
    }

    if (a.zero()) {
      if (isNaN(bv)) {
        return approx(NaN)
      } else if (bv < 0) {
        return approx(Infinity)
      } else if (bv == 0) {
        return int(1)
      } else {
        return int(0)
      }
    }

    if (a.d !== null) {
      const n = a.n ** bv
      const d = a.d ** bv
      if (safe(n) && safe(d)) return frac(n, d)
    }

    // TODO: things like (-8) ** (1/3) don't work
    // TODO: use approx and exact better
    return approx(a.num() ** bv)
  }

  floor(): SReal {
    return int(floor(this.num()))
  }

  ceil(): SReal {
    return int(ceil(this.num()))
  }

  round(): SReal {
    return int(round(this.num()))
  }
}

const FLOAT32 = new Float32Array(1)

function gcd(a: number, b: number) {
  for (let temp = b; b !== 0; ) {
    b = a % b
    a = temp
    temp = b
  }
  return a
}

/**
 * If `n` and `d` are safe integers, returns the exact fraction `n/d`.
 * Otherwise, returns the approximate result `~n/d`.
 */
export function frac(n: number, d: number): SReal {
  if (safe(n) && safe(d) && d !== 0) {
    if (d < 0) {
      n = -n
      d = -d
    }

    const g = gcd(n < 0 ? -n : n, d)
    return new (SReal as any)(n / g, d / g)
  } else {
    return approx(n / d)
  }
}

/** Returns the approximate result `~n`. */
export function approx(n: number): SReal {
  return new (SReal as any)(n)
}

/**
 * If `n` is a safe integer, returns the exact fraction `n/1`. Otherwise,
 * returns the approximate result `~n`.
 */
export function int(n: number): SReal {
  return new (SReal as any)(n, safe(n) ? 1 : null)
}
