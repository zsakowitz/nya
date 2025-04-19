const { abs, hypot } = Math

type PointData<N extends number> =
  N extends 2 ? readonly [number, number]
  : N extends 3 ? readonly [number, number, number]
  : N extends 4 ? readonly [number, number, number, number]
  : readonly number[]

/** A point type based on plain JavaScript floating-point numbers. */
export class Point<out N extends number = 2> {
  private constructor(readonly d: PointData<N>) {}

  get x(): N extends 2 ? number : number | undefined {
    return this.d[0]
  }

  get y(): N extends 2 ? number : number | undefined {
    return this.d[1]
  }

  add(other: Point<N>): Point<N> {
    return px(this.d.map((a, i) => a + other.d[i]!)) as Point<any>
  }

  sub(other: Point<N>): Point<N> {
    return px(this.d.map((a, i) => a - other.d[i]!)) as Point<any>
  }

  mulEach(other: Point<N>): Point<N> {
    return px(this.d.map((a, i) => a * other.d[i]!)) as Point<any>
  }

  mulR(other: number): Point<N> {
    return px(this.d.map((x) => x * other)) as Point<any>
  }

  divR(other: number): Point<N> {
    return px(this.d.map((x) => x / other)) as Point<any>
  }

  unsign(): Point<N> {
    return px(this.d.map((x) => abs(x))) as Point<any>
  }

  neg(): Point<N> {
    return px(this.d.map((x) => -x)) as Point<any>
  }

  hypot(): number {
    return hypot(...this.d)
  }

  zero(): boolean {
    return this.d.every((x) => x === 0)
  }

  // TODO: handle infinity
  norm(): Point<N> {
    if (this.zero()) {
      return this
    }
    return this.divR(this.hypot())
  }

  normFrom(from: Point<N>): Point<N> {
    return this.sub(from).norm().add(from)
  }

  finite(): boolean {
    return this.d.every((x) => isFinite(x))
  }

  gl32(this: Point<2 | 3 | 4>) {
    return `vec${this.d.length}(${this.d.map((x) => x.toExponential()).join(", ")})`
  }
}

export function px<const T extends readonly number[]>(
  data: T,
): Point<T["length"]> {
  return new (Point as any)(data)
}

export function pxnan<const N extends number>(n: N): Point<N> {
  return px(Array.from({ length: n }, () => NaN)) as Point<any>
}
