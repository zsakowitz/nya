import { safe } from "@/eval/lib/util"

/**
 * A real number type which preserves exact values for fractions (0.1 is
 * represented as 1/10, not
 * `0.1000000000000000055511151231257827021181583404541015625`).
 */
export class SReal {
  private constructor(
    private readonly n: number,
    private readonly d: number | null,
  ) {}

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
      const n = Math.sqrt(this.n)
      const d = Math.sqrt(this.d)
      if (safe(n) && safe(d)) {
        return frac(n, d)
      }
    }

    return approx(Math.sqrt(this.num()))
  }

  abs(): SReal {
    return this.num() < 0 ? this.neg() : this
  }

  sign(): SReal {
    return int(Math.sign(this.num()))
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

  isApprox() {
    return this.d === null
  }
}

function gcd(a: number, b: number) {
  for (let temp = b; b !== 0; ) {
    b = a % b
    a = temp
    temp = b
  }
  return a
}

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

export function approx(n: number): SReal {
  return new (SReal as any)(n)
}

export function int(n: number): SReal {
  return new (SReal as any)(n, safe(n) ? 1 : null)
}
