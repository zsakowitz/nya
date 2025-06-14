import s0 from "./scripts/real.nya"
import s1 from "./scripts/complex.nya"
import s2 from "./scripts/point.nya"
import s3 from "./scripts/color.nya"
import s4 from "./scripts/preload.nya"
import s5 from "./scripts/erf.nya"
import s6 from "./scripts/geometry.nya"
import s7 from "./scripts/gamma.nya"
import s8 from "./scripts/data/distributions.nya"
import s9 from "./scripts/4d/two-complex.nya"
import s10 from "./scripts/4d/point.nya"
import s11 from "./scripts/color/extras.nya"
import s12 from "./scripts/color/oklab.nya"
import s13 from "./scripts/color/core.nya"
import s14 from "./scripts/core/cmp.nya"
import s15 from "./scripts/core/ops.nya"
import s16 from "./scripts/3d/point.nya"

export const SCRIPTS = new Map([
  ["real", s0],
  ["complex", s1],
  ["point", s2],
  ["color", s3],
  ["preload", s4],
  ["erf", s5],
  ["geometry", s6],
  ["gamma", s7],
  ["data/distributions", s8],
  ["4d/two-complex", s9],
  ["4d/point", s10],
  ["color/extras", s11],
  ["color/oklab", s12],
  ["color/core", s13],
  ["core/cmp", s14],
  ["core/ops", s15],
  ["3d/point", s16],
])

export type ScriptName =
  | "real"
  | "complex"
  | "point"
  | "color"
  | "preload"
  | "erf"
  | "geometry"
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
