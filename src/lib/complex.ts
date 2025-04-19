import { px, type Point } from "./point"
import { approx, int, type SReal } from "./real"

const { sin, cos, exp, log, atan2, hypot, floor, sinh, cosh, sqrt } = Math

export class Complex {
  private constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  add(other: Complex): Complex {
    return cx(this.x + other.x, this.y + other.y)
  }

  sub(other: Complex): Complex {
    return cx(this.x - other.x, this.y - other.y)
  }

  mul(other: Complex): Complex {
    const { x: a, y: b } = this
    const { x: c, y: d } = other
    return cx(a * c - b * d, b * c + a * d)
  }

  mulR(other: number): Complex {
    return cx(this.x * other, this.y * other)
  }

  mulEach(other: Complex): Complex {
    return cx(this.x * other.x, this.y * other.y)
  }

  div(other: Complex): Complex {
    const { x: a, y: b } = this
    const { x: c, y: d } = other
    const x = a * c + b * d
    const y = b * c - a * d
    const denom = c * c + d * d
    return cx(x / denom, y / denom)
  }

  divR(other: number): Complex {
    return cx(this.x / other, this.y / other)
  }

  inv(): Complex {
    const { x, y } = this
    const denom = x * x + y * y
    return cx(x / denom, -y / denom)
  }

  arg(): number {
    return atan2(this.y, this.x)
  }

  abs(): number {
    return hypot(this.x, this.y)
  }

  sign(): Complex {
    const { x, y } = this
    const xn = x
    const yn = y
    if (xn == 0 && yn == 0) {
      return this
    }
    const a = this.abs()
    return cx(x / a, y / a)
  }

  sqrt(): Complex {
    return rt(sqrt(this.abs()), this.arg() / 2)
  }

  square(): Complex {
    const { x: a, y: b } = this
    return cx(a * a - b * b, 2 * a * b)
  }

  neg(): Complex {
    return cx(-this.x, -this.y)
  }

  exp(): Complex {
    const { x, y } = this
    const xn = x
    const yn = y
    return cx(exp(xn) * cos(yn), exp(xn) * sin(yn))
  }

  ln(): Complex {
    const r = this.abs()
    const t = this.arg()
    return cx(log(r), t)
  }

  /** Defined like Desmos. */
  floor(): Complex {
    const px = this.x
    const py = this.y
    const bx = floor(px)
    const by = floor(py)
    const x = px - bx
    const y = py - by

    if (1.0 <= x + y) {
      if (x >= y) {
        return cx(bx + 1, by)
      } else {
        return cx(bx, by + 1)
      }
    } else {
      return cx(bx, by)
    }
  }

  /** Defined like Desmos. */
  ceil(): Complex {
    const px = this.x + 0.5
    const py = this.y + 0.5
    const bx = floor(px)
    const by = floor(py)
    const x = px - bx
    const y = py - by

    if (1.0 < x + y) {
      if (x >= y) {
        return cx(bx + 1, by)
      } else {
        return cx(bx, by + 1)
      }
    } else {
      return cx(bx, by)
    }
  }

  sin(): Complex {
    const { x, y } = this
    return cx(sin(x) * cosh(y), cos(x) * sinh(y))
  }

  cos(): Complex {
    const { x, y } = this
    return cx(cos(x) * cosh(y), -sin(x) * sinh(y))
  }

  tan(): Complex {
    return this.sin().div(this.cos())
  }

  cot(): Complex {
    return this.cos().div(this.sin())
  }

  mulI(): Complex {
    return cx(-this.y, this.x)
  }

  divI(): Complex {
    return cx(this.y, -this.x)
  }

  asin(): Complex {
    const z = this
    return cx(1, 0).sub(z.square()).sqrt().sub(z.mulI()).ln().mulI()
  }

  acos(): Complex {
    const z = this
    return cx(1, 0).sub(z.square()).mulI().add(z).ln().divI()
  }

  atan(): Complex {
    return cx(0, 1).sub(this).div(cx(0, 1).add(this)).ln().divI().divR(2)
  }

  eq(other: Complex) {
    return this.x == other.x && this.y == other.y
  }

  s(): SComplex {
    return xy(int(this.x), int(this.y))
  }

  toString() {
    const y = this.y.toString()
    return `${this.x}${y[0] == "-" ? "" : "+"}${y}i`
  }

  pow(other: Complex): Complex {
    return other.mul(this.ln()).exp()
  }

  xy(): Point {
    return px(this.x, this.y)
  }

  sinh(): Complex {
    const { x, y } = this
    return cx(cos(y) * sinh(x), sin(y) * cosh(x))
  }

  cosh(): Complex {
    const { x, y } = this
    return cx(cos(y) * cosh(x), sin(y) * sinh(x))
  }

  tanh(): Complex {
    return this.sinh().div(this.cosh())
  }

  coth(): Complex {
    return this.cosh().div(this.sinh())
  }

  asinh(): Complex {
    return this.square().add(cx(1, 0)).sqrt().add(this).ln()
  }

  acosh(): Complex {
    const p1 = this.add(cx(1, 0)).sqrt()
    const m1 = this.sub(cx(1, 0)).sqrt()
    return p1.mul(m1).add(this).ln()
  }

  atanh(): Complex {
    const p1 = cx(1, 0).add(this)
    const m1 = cx(1, 0).sub(this)
    return p1.div(m1).ln().divR(2)
  }

  acoth(): Complex {
    const p1 = this.add(cx(1, 0))
    const m1 = this.sub(cx(1, 0))
    return p1.div(m1).ln().divR(2)
  }
}

export function cx(x: number, y: number): Complex {
  return new (Complex as any)(x, y)
}

export function rt(r: number, t: number): Complex {
  return cx(r * cos(t), r * sin(t))
}

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
