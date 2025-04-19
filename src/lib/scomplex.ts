import { cx, type Complex } from "./complex"
import { type Point } from "./point"
import { approx, int, type SReal } from "./sreal"

/**
 * A complex number type which preserves exact values for fractions (0.1 is
 * represented as 1/10, not
 * `0.1000000000000000055511151231257827021181583404541015625`).
 *
 * Only methods which preserve fractions are provided; for an equivalent with
 * more methods (trig, exp, ln, etc.), convert to {@linkcode Complex} via the
 * {@linkcode SComplex.ns} method.
 */
export class SComplex {
  private constructor(
    readonly x: SReal,
    readonly y: SReal,
  ) {}

  add(other: SComplex): SComplex {
    return xy(this.x.add(other.x), this.y.add(other.y))
  }

  sub(other: SComplex): SComplex {
    return xy(this.x.sub(other.x), this.y.sub(other.y))
  }

  mul(other: SComplex): SComplex {
    const { x: a, y: b } = this
    const { x: c, y: d } = other
    return xy(a.mul(c).sub(b.mul(d)), b.mul(c).add(a.mul(d)))
  }

  mulR(other: SReal): SComplex {
    return xy(this.x.mul(other), this.y.mul(other))
  }

  mulEach(other: SComplex): SComplex {
    return xy(this.x.mul(other.x), this.y.mul(other.y))
  }

  div(other: SComplex): SComplex {
    const { x: a, y: b } = this
    const { x: c, y: d } = other
    const x = a.mul(c).add(b.mul(d))
    const y = b.mul(c).sub(a.mul(d))
    const denom = c.hypot2(d)
    return xy(x.div(denom), y.div(denom))
  }

  divR(other: SReal): SComplex {
    return xy(this.x.div(other), this.y.div(other))
  }

  inv(): SComplex {
    const { x, y } = this
    const denom = x.hypot2(y)
    return xy(x.div(denom), y.neg().div(denom))
  }

  arg(): number {
    return Math.atan2(this.y.num(), this.x.num())
  }

  abs(): SReal {
    return this.x.hypot(this.y)
  }

  unsign(): SComplex {
    return xy(this.x.abs(), this.y.abs())
  }

  conj(): SComplex {
    return xy(this.x, this.y.neg())
  }

  sign(): SComplex {
    const { x, y } = this
    const xn = x.num()
    const yn = y.num()
    if (xn == 0 && yn == 0) {
      return this
    }
    return this.divR(this.abs())
  }

  square(): SComplex {
    const { x: a, y: b } = this
    return xy(a.square().sub(b.square()), a.mul(b).mul(int(2)))
  }

  neg(): SComplex {
    return xy(this.x.neg(), this.y.neg())
  }

  isApprox() {
    return this.x.isApprox() || this.y.isApprox()
  }

  ns() {
    return cx(this.x.num(), this.y.num())
  }

  /** Defined like Desmos. */
  floor(): SComplex {
    const px = this.x.num()
    const py = this.y.num()
    const bx = Math.floor(px)
    const by = Math.floor(py)
    const x = px - bx
    const y = py - by

    if (1.0 <= x + y) {
      if (x >= y) {
        return xy(int(bx + 1), int(by))
      } else {
        return xy(int(bx), int(by + 1))
      }
    } else {
      return xy(int(bx), int(by))
    }
  }

  /** Defined like Desmos. */
  ceil(): SComplex {
    const px = this.x.num() + 0.5
    const py = this.y.num() + 0.5
    const bx = Math.floor(px)
    const by = Math.floor(py)
    const x = px - bx
    const y = py - by

    if (1.0 < x + y) {
      if (x >= y) {
        return xy(int(bx + 1), int(by))
      } else {
        return xy(int(bx), int(by + 1))
      }
    } else {
      return xy(int(bx), int(by))
    }
  }

  roundEach(): SComplex {
    return xy(this.x.round(), this.y.round())
  }

  pow(other: SComplex): SComplex {
    if (other.y.zero() && this.y.zero() && this.x.num() > 0) {
      return xy(this.x.pow(other.x), int(0))
    }
    return this.ns().pow(other.ns()).s()
  }

  zero(): boolean {
    return this.x.zero() && this.y.zero()
  }

  xy(): Point {
    return this.ns().xy()
  }

  gl32() {
    return `vec2(${this.x.gl32()}, ${this.y.gl32()})`
  }

  gl64() {
    return `vec4(${this.x.gl64()}, ${this.y.gl64()})`
  }
}

export function xy(x: SReal, y: SReal): SComplex {
  return new (SComplex as any)(x, y)
}

export function xyint(x: number, y: number): SComplex {
  return xy(int(x), int(y))
}

export function xynan() {
  return xy(approx(NaN), approx(NaN))
}
