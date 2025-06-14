import s0 from "./scripts/real.nya"
import s1 from "./scripts/complex.nya"
import s2 from "./scripts/point.nya"
import s3 from "./scripts/color.nya"
import s4 from "./scripts/erf.nya"
import s5 from "./scripts/gamma.nya"
import s6 from "./scripts/data/distributions.nya"
import s7 from "./scripts/4d/point.nya"
import s8 from "./scripts/color/extras.nya"
import s9 from "./scripts/color/oklab.nya"
import s10 from "./scripts/color/core.nya"
import s11 from "./scripts/core/cmp.nya"
import s12 from "./scripts/core/ops.nya"
import s13 from "./scripts/3d/point.nya"

export const SCRIPTS = new Map([
  ["real", s0],
  ["complex", s1],
  ["point", s2],
  ["color", s3],
  ["erf", s4],
  ["gamma", s5],
  ["data/distributions", s6],
  ["4d/point", s7],
  ["color/extras", s8],
  ["color/oklab", s9],
  ["color/core", s10],
  ["core/cmp", s11],
  ["core/ops", s12],
  ["3d/point", s13],
])

export type ScriptName =
  | "real"
  | "complex"
  | "point"
  | "color"
  | "erf"
  | "gamma"
  | "data/distributions"
  | "4d/point"
  | "color/extras"
  | "color/oklab"
  | "color/core"
  | "core/cmp"
  | "core/ops"
  | "3d/point"
