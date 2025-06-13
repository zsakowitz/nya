import s0 from "./scripts/point.nya"
import s1 from "./scripts/color.nya"
import s2 from "./scripts/erf.nya"
import s3 from "./scripts/gamma.nya"
import s4 from "./scripts/data/distributions.nya"
import s5 from "./scripts/4d/point.nya"
import s6 from "./scripts/num/real.nya"
import s7 from "./scripts/num/complex.nya"
import s8 from "./scripts/color/extras.nya"
import s9 from "./scripts/color/core.nya"
import s10 from "./scripts/core/cmp.nya"
import s11 from "./scripts/3d/point.nya"

export const SCRIPTS = new Map([
  ["point", s0],
  ["color", s1],
  ["erf", s2],
  ["gamma", s3],
  ["data/distributions", s4],
  ["4d/point", s5],
  ["num/real", s6],
  ["num/complex", s7],
  ["color/extras", s8],
  ["color/core", s9],
  ["core/cmp", s10],
  ["3d/point", s11],
])

export type ScriptName =
  | "point"
  | "color"
  | "erf"
  | "gamma"
  | "data/distributions"
  | "4d/point"
  | "num/real"
  | "num/complex"
  | "color/extras"
  | "color/core"
  | "core/cmp"
  | "3d/point"
