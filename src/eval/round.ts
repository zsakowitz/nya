export function round(v: number) {
  if (!isFinite(v)) return v
  const r = 10 ** (Math.floor(Math.log10(Math.abs(v) * Number.EPSILON)) + 5)
  return Math.round(v / r) * r
}
