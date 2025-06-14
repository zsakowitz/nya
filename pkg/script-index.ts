import s0 from "./scripts/real.nya"
import s1 from "./scripts/complex.nya"
import s2 from "./scripts/point.nya"
import s3 from "./scripts/color.nya"
import s4 from "./scripts/preload.nya"
import s5 from "./scripts/erf.nya"
import s6 from "./scripts/gamma.nya"
import s7 from "./scripts/data/distributions.nya"
import s8 from "./scripts/4d/two-complex.nya"
import s9 from "./scripts/4d/point.nya"
import s10 from "./scripts/color/extras.nya"
import s11 from "./scripts/color/oklab.nya"
import s12 from "./scripts/color/core.nya"
import s13 from "./scripts/core/cmp.nya"
import s14 from "./scripts/core/ops.nya"
import s15 from "./scripts/3d/point.nya"

export const SCRIPTS = new Map([
  ["real", s0],
  ["complex", s1],
  ["point", s2],
  ["color", s3],
  ["preload", s4],
  ["erf", s5],
  ["gamma", s6],
  ["data/distributions", s7],
  ["4d/two-complex", s8],
  ["4d/point", s9],
  ["color/extras", s10],
  ["color/oklab", s11],
  ["color/core", s12],
  ["core/cmp", s13],
  ["core/ops", s14],
  ["3d/point", s15],
])

export type ScriptName =
  | "real"
  | "complex"
  | "point"
  | "color"
  | "preload"
  | "erf"
  | "gamma"
  | "data/distributions"
  | "4d/two-complex"
  | "4d/point"
  | "color/extras"
  | "color/oklab"
  | "color/core"
  | "core/cmp"
  | "core/ops"
  | "3d/point"
