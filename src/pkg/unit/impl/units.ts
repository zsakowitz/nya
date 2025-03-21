import { approx, frac, real } from "@/eval/ty/create"
import { UNIT_KIND_VALUES } from "./kind"
import { unit, type Unit } from "./system"

export const nan = unit("undefined", [], approx(NaN), approx(NaN))

// FIXME: Hz, L
const { m, kg, s, K, A, mol, cd } = UNIT_KIND_VALUES
const g = unit("g", "kg", frac(1, 1e3))
const cm = unit("cm", "m", frac(1, 1e2))
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
const mL = unit("mL", [{ unit: "m", exp: 3 }], frac(1, 1e6))
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
const J = unit("J", [
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
const kcal = unit(
  "kcal",
  [
    { unit: "kg", exp: 1 },
    { unit: "m", exp: 2 },
    { unit: "s", exp: -2 },
  ],
  frac(4184, 1),
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

export const UNITS: Record<string, Unit> = {
  // @ts-expect-error ts doesn't recognize __proto__
  __proto__: null,
  m,
  meter: m,
  kg,
  kilogram: kg,
  kilogramme: kg,
  s,
  second: s,
  K,
  kelvin: K,
  A,
  ampere: A,
  amp: A,
  au,
  astronomicalunit: au,
  mol,
  mole: mol,
  cd,
  candela: cd,
  cm,
  centimeter: cm,
  min,
  minute: min,
  hr,
  hour: hr,
  d,
  day: d,
  dC: dC,
  dF: dF,
  ddC: ddC,
  ddF: ddF,
  celsius: dC,
  fahrenheit: dF,
  deltacelsius: ddC,
  deltafahrenheit: ddF,
  N,
  newton: N,
  J,
  joule: J,
  cal,
  calorie: cal,
  calourie: cal,
  kcal,
  Cal: kcal,
  Calorie: cal,
  Calourie: cal,
  Pa,
  pascal: Pa,
  W,
  watt: W,
  C,
  coulomb: C,
  V,
  volt: V,
  ohm,
  S,
  siemens: S,
  F,
  farad: F,
  H,
  henry: H,
  Wb,
  weber: Wb,
  T,
  tesla: T,
  G,
  Gs: G,
  gauss: G,
  in: inch,
  inch,
  ft,
  foot: ft,
  lb: lbf,
  pound: lbf,
  L,
  liter: L,
  mL,
  milliliter: mL,
  g,
  gram: g,
  Hz,
  hertz: Hz,
}
