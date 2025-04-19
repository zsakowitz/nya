import { xy, type SComplex } from "./scomplex"
import { int } from "./sreal"

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
}

export function cx(x: number, y: number): Complex {
  return new (Complex as any)(x, y)
}

export function rt(r: number, t: number): Complex {
  return cx(r * cos(t), r * sin(t))
}
