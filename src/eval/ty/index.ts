export type SApprox = { type: "approx"; value: number }
export type SExact = { type: "exact"; n: number; d: number }
export type SReal = SApprox | SExact

export type SPoint = { type: "point"; x: SReal; y: SReal }
export type SColor = { type: "color"; r: SReal; g: SReal; b: SReal; a: SReal }

export function list(values: string[], conj = "and"): string {
  if (values.length == 0) {
    return "nothing"
  }

  if (values.length == 1) {
    return values[0]!
  }

  if (values.length == 2) {
    return values[0]! + ` ${conj} ` + values[1]!
  }

  return (
    values.slice(0, -1).join(", ") + `, ${conj} ` + values[values.length - 1]!
  )
}
