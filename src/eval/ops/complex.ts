import type { SPoint } from "@/eval/ty"
import type { Point } from "@/sheet/point"
import { rept, unpt } from "../ty/create"

// TODO: make everything use cx instead of {x,y}
export function cx(x: number, y = 1): Point {
  return { x, y }
}

export function addP(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function subP(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function negP(a: Point): Point {
  return cx(-a.x, -a.y)
}

export function mulP({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point): Point {
  return {
    x: x1 * x2 - y1 * y2,
    y: y1 * x2 + x1 * y2,
  }
}

export function recipP({ x: c, y: d }: Point): Point {
  const denom = c * c + d * d
  if (denom == 0) return cx(1 / c, 1 / d)
  return cx(c / denom, -d / denom)
}

export function divP({ x: a, y: b }: Point, { x: c, y: d }: Point): Point {
  const x = a * c + b * d
  const y = b * c - a * d
  const denom = c * c + d * d
  return { x: x / denom, y: y / denom }
}

export function scaleP(n: number, p: Point) {
  return {
    x: n * p.x,
    y: n * p.y,
  }
}

export function sqrP(a: Point): Point {
  return { x: a.x * a.x - a.y * a.y, y: 2 * a.x * a.y }
}

export function rcis(r: number, t: number): Point {
  return {
    x: r * Math.cos(t),
    y: r * Math.sin(t),
  }
}

export function rtP(a: Point): [r: number, t: number] {
  return [Math.hypot(a.x, a.y), Math.atan2(a.y, a.x)]
}

export function sqrtP(a: Point): Point {
  const [r, t] = rtP(a)
  return rcis(Math.sqrt(r), t / 2)
}

export function lnP(a: Point): Point {
  const [r, t] = rtP(a)
  return { x: Math.log(r), y: t }
}

export function mulI({ x: a, y: b }: Point): Point {
  return { x: -b, y: a }
}

export function negI({ x: a, y: b }: Point): Point {
  return { x: b, y: -a }
}

export function floorP(p: Point): Point {
  const b = cx(Math.floor(p.x), Math.floor(p.y))
  const x = p.x - Math.floor(p.x)
  const y = p.y - Math.floor(p.y)

  if (1.0 <= x + y) {
    if (x >= y) {
      return cx(b.x + 1, b.y)
    } else {
      return cx(b.x, b.y + 1)
    }
  } else {
    return b
  }
}

export function ceilP(z: Point): Point {
  const b = cx(Math.ceil(z.x), Math.ceil(z.y))
  const x = z.x - Math.floor(z.x)
  const y = z.y - Math.floor(z.y)

  if (1.0 > x + y) {
    if (x < y) {
      return cx(b.x - 1, b.y)
    } else {
      return cx(b.x, b.y - 1)
    }
  } else {
    return b
  }
}

export function onP(f: (x: Point) => Point) {
  return (x: { value: SPoint }) => rept(f(unpt(x.value)))
}
