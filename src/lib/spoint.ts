import type { SComplex } from "./scomplex"
import { approx, int, type SReal } from "./sreal"

type PointData<N extends number> =
  N extends 2 ? readonly [SReal, SReal]
  : N extends 3 ? readonly [SReal, SReal, SReal]
  : N extends 4 ? readonly [SReal, SReal, SReal, SReal]
  : readonly SReal[]

/**
 * A point type which preserves exact values for fractions (0.1 is represented
 * as 1/10, not `0.1000000000000000055511151231257827021181583404541015625`).
 *
 * The only methods provided are methods which make sense for points. If working
 * with complex numbers, {@linkcode SComplex} is more useful.
 */
export class SPoint<out N extends number> {
  private constructor(readonly d: PointData<N>) {}

  add(other: SPoint<N>): SPoint<N> {
    return pt(this.d.map((a, i) => a.add(other.d[i]!))) as SPoint<any>
  }

  sub(other: SPoint<N>): SPoint<N> {
    return pt(this.d.map((a, i) => a.sub(other.d[i]!))) as SPoint<any>
  }

  mulEach(other: SPoint<N>): SPoint<N> {
    return pt(this.d.map((a, i) => a.mul(other.d[i]!))) as SPoint<any>
  }

  mulR(other: SReal): SPoint<N> {
    return pt(this.d.map((x) => x.mul(other))) as SPoint<any>
  }

  divR(other: SReal): SPoint<N> {
    return pt(this.d.map((x) => x.div(other))) as SPoint<any>
  }

  unsign(): SPoint<N> {
    return pt(this.d.map((x) => x.abs())) as SPoint<any>
  }

  neg(): SPoint<N> {
    return pt(this.d.map((x) => x.neg())) as SPoint<any>
  }

  isApprox() {
    return this.d.some((x) => x.isApprox())
  }

  hypot(): SReal {
    return this.d.reduce((a, b) => a.add(b.square()), int(0)).sqrt()
  }

  finite(): boolean {
    return this.d.every((x) => x.finite())
  }

  gl32(this: SPoint<2 | 3 | 4>) {
    return `vec${this.d.length}(${this.d.map((x) => x.gl32()).join(", ")})`
  }

  gl64(this: SPoint<2>) {
    return `vec${2 * this.d.length}(${this.d.map((x) => x.gl64()).join(", ")})`
  }
}

export function pt<const T extends readonly SReal[]>(
  data: T,
): SPoint<T["length"]> {
  return new (SPoint as any)(data)
}

export function ptnan<const N extends number>(n: N): SPoint<N> {
  return pt(Array.from({ length: n }, () => approx(NaN))) as SPoint<any>
}
