import type { SReal } from "@/eval/ty"
import { approx, frac, num, real } from "@/eval/ty/create"
import { mul } from "@/eval/ty/ops"
import type { UnitKind } from "./kind"
import type { BaseUnit, Unit } from "./system"

export function unit(
  label: string,
  category: UnitKind | BaseUnit[],
  scale: SReal = frac(1, 1),
  offset: SReal = frac(0, 1),
): Unit {
  return {
    label,
    base: {
      dst:
        typeof category == "string" ? [{ exp: 1, unit: category }] : category,
      scale,
      offset,
    },
  }
}

export const nan = unit("undefined", [], approx(NaN), approx(NaN))

const m = unit("m", "m")
const s = unit("s", "s")
export const UNIT_KELVIN = unit("K", "K")
const A = unit("A", "A")
export const UNIT_MOLE = unit("mol", "mol")
const cd = unit("cd", "cd")

const g = unit("g", "kg", frac(1, 1e3))
const au = unit("au", "m", real(149597870700))
const min = unit("min", "s", frac(60, 1))
const hr = unit("hr", "s", frac(3600, 1))
const dC = unit("°C", "K", real(1), frac(5463, 20))
const dF = unit("°F", "K", frac(5, 9), frac(45967, 180))
const ddC = unit("∆°C", "K", real(1))
const ddF = unit("∆°F", "K", frac(5, 9))
const d = unit("d", "s", frac(86400, 1))
const Hz = unit("Hz", [{ unit: "s", exp: -1 }], frac(1, 1))
const inch = unit("in", "m", frac(127, 5e3))
const ft = unit("ft", "m", frac(381, 1250))
const L = unit("L", [{ unit: "m", exp: 3 }], frac(1, 1e3))
const lbf = unit(
  "lbf",
  [
    { unit: "kg", exp: 1 },
    { unit: "m", exp: 1 },
    { unit: "s", exp: -2 },
  ],
  frac(4448222, 1e6),
)
const N = unit("N", [
  { unit: "kg", exp: 1 },
  { unit: "m", exp: 1 },
  { unit: "s", exp: -2 },
])
export const UNIT_JOULE = unit("J", [
  { unit: "kg", exp: 1 },
  { unit: "m", exp: 2 },
  { unit: "s", exp: -2 },
])
const cal = unit(
  "cal",
  [
    { unit: "kg", exp: 1 },
    { unit: "m", exp: 2 },
    { unit: "s", exp: -2 },
  ],
  frac(4184, 1000),
)
const Pa = unit("Pa", [
  { unit: "kg", exp: 1 },
  { unit: "m", exp: -1 },
  { unit: "s", exp: -2 },
])
const W = unit("W", [
  { unit: "kg", exp: 1 },
  { unit: "m", exp: 2 },
  { unit: "s", exp: -3 },
])
const C = unit("C", [
  { unit: "A", exp: 1 },
  { unit: "s", exp: 1 },
])
const V = unit("V", [
  { unit: "kg", exp: 1 },
  { unit: "m", exp: 2 },
  { unit: "s", exp: -3 },
  { unit: "A", exp: -1 },
])
const ohm = unit("Ω", [
  { unit: "kg", exp: 1 },
  { unit: "m", exp: 2 },
  { unit: "s", exp: -3 },
  { unit: "A", exp: -2 },
])
const S = unit("S", [
  { unit: "kg", exp: -1 },
  { unit: "m", exp: -2 },
  { unit: "s", exp: 3 },
  { unit: "A", exp: 2 },
])
const F = unit("F", [
  { unit: "kg", exp: -1 },
  { unit: "m", exp: -2 },
  { unit: "s", exp: 4 },
  { unit: "A", exp: 2 },
])
const H = unit("H", [
  { unit: "kg", exp: 1 },
  { unit: "m", exp: 2 },
  { unit: "s", exp: -2 },
  { unit: "A", exp: -2 },
])
const Wb = unit("Wb", [
  { unit: "kg", exp: 1 },
  { unit: "m", exp: 2 },
  { unit: "s", exp: -2 },
  { unit: "A", exp: -1 },
])
const T = unit("T", [
  { unit: "kg", exp: 1 },
  { unit: "s", exp: -2 },
  { unit: "A", exp: -1 },
])
const G = unit(
  "G",
  [
    { unit: "kg", exp: 1 },
    { unit: "s", exp: -2 },
    { unit: "A", exp: -1 },
  ],
  frac(1, 1e4),
)
export const UNIT_AMU = unit("amu", "kg", real(1.6605390689252e-27))

const SCALABLE: Record<string, Unit> = {
  // @ts-expect-error ts doesn't recognize __proto__
  __proto__: null,
  m,
  s,
  K: UNIT_KELVIN,
  A,
  au,
  mol: UNIT_MOLE,
  cd,
  min,
  hr,
  d,
  dC: dC,
  dF: dF,
  ddC: ddC,
  ddF: ddF,
  N,
  joule: UNIT_JOULE,
  cal,
  Pa,
  W,
  C,
  V,
  ohm,
  S,
  F,
  H,
  Wb,
  T,
  G,
  Gs: G,
  in: inch,
  ft,
  lb: lbf,
  L,
  g,
  Hz,
  Da: UNIT_AMU,
  u: UNIT_AMU,
  amu: UNIT_AMU,

  meter: m,
  kelvin: UNIT_KELVIN,
  second: s,
  ampere: A,
  amp: A,
  astronomicalunit: au,
  mole: UNIT_MOLE,
  candela: cd,
  minute: min,
  hour: hr,
  day: d,
  celsius: dC,
  fahrenheit: dF,
  deltacelsius: ddC,
  deltafahrenheit: ddF,
  newton: N,
  J: UNIT_JOULE,
  calorie: cal,
  calourie: cal,
  pascal: Pa,
  watt: W,
  coulomb: C,
  volt: V,
  siemens: S,
  farad: F,
  henry: H,
  weber: Wb,
  tesla: T,
  gauss: G,
  inch,
  foot: ft,
  pound: lbf,
  liter: L,
  gram: g,
  hertz: Hz,
  dalton: UNIT_AMU,
}

const SCALARS = Object.entries({
  Q: frac(1e30, 1),
  R: frac(1e27, 1),
  Y: frac(1e24, 1),
  Z: frac(1e21, 1),
  E: frac(1e18, 1),
  P: frac(1e15, 1),
  T: frac(1e12, 1),
  G: frac(1e9, 1),
  M: frac(1e6, 1),
  k: frac(1e3, 1),
  h: frac(1e2, 1),
  da: frac(1e1, 1),
  d: frac(1, 1e1),
  c: frac(1, 1e2),
  m: frac(1, 1e3),
  μ: frac(1, 1e6),
  n: frac(1, 1e9),
  p: frac(1, 1e12),
  f: frac(1, 1e15),
  a: frac(1, 1e18),
  z: frac(1, 1e21),
  y: frac(1, 1e24),
  r: frac(1, 1e27),
  q: frac(1, 1e30),
})

const SCALED = Object.fromEntries(
  SCALARS.flatMap(([name, mx]) =>
    Object.entries(SCALABLE)
      .filter((x) => num(x[1].base.offset) == 0)
      .map(([k, v]) => [
        name + k,
        {
          label: name + v.label,
          base: {
            dst: v.base.dst,
            offset: v.base.offset,
            scale: mul(v.base.scale, mx),
          },
        },
      ]),
  ),
)

export const UNIT_KIND_VALUES: Record<UnitKind, Unit> = {
  // @ts-expect-error ts doesn't recognize __proto__
  __proto__: null,
  m,
  kg: SCALED.kg!,
  s,
  K: UNIT_KELVIN,
  A,
  mol: UNIT_MOLE,
  cd,
}

export const UNITS: Record<string, Unit> = {
  // @ts-ignore
  __proto__: null,
  ...SCALABLE,
  ...SCALED,
  Cal: SCALED.kcal!,
  Calorie: SCALED.kcal!,
  Calourie: SCALED.kcal!,
}

export const UNIT_KILOJOULE = UNITS.kJ!
