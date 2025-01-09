import type { SPoint, SReal } from "."

export function isZero(v: SPoint | SReal): boolean {
  if (v.type == "approx") {
    return v.value == 0
  }

  if (v.type == "exact") {
    return v.n == 0
  }

  return isZero(v.x) && isZero(v.y)
}
