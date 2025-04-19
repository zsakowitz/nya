import type { SComplex } from "./scomplex"
import type { SReal } from "./sreal"

/**
 * A point type which preserves exact values for fractions (0.1 is represented
 * as 1/10, not `0.1000000000000000055511151231257827021181583404541015625`).
 *
 * The only methods provided are methods which make sense for points. If working
 * with complex numbers, {@linkcode SComplex} is more useful.
 */
export class SPoint {
  private constructor(
    readonly x: SReal,
    readonly y: SReal,
  ) {}

  add(other: SPoint): SPoint {
    return xy(this.x.add(other.x), this.y.add(other.y))
  }

  sub(other: SPoint): SPoint {
    return xy(this.x.sub(other.x), this.y.sub(other.y))
  }

  mulR(other: SReal): SPoint {
    return xy(this.x.mul(other), this.y.mul(other))
  }

  divR(other: SReal): SPoint {
    return xy(this.x.div(other), this.y.div(other))
  }

  arg(): number {
    return Math.atan2(this.y.num(), this.x.num())
  }

  abs(): SReal {
    return this.x.hypot(this.y)
  }

  neg(): SPoint {
    return xy(this.x.neg(), this.y.neg())
  }

  isApprox() {
    return this.x.isApprox() || this.y.isApprox()
  }
}

export function xy(x: SReal, y: SReal): SPoint {
  return new (SPoint as any)(x, y)
}
