import s0 from "./scripts/numtheory-real.nya"
import s1 from "./scripts/real.nya"
import s2 from "./scripts/complex.nya"
import s3 from "./scripts/point.nya"
import s4 from "./scripts/color.nya"
import s5 from "./scripts/erf.nya"
import s6 from "./scripts/numtheory-complex.nya"
import s7 from "./scripts/geometry.nya"
import s8 from "./scripts/gamma.nya"
import s9 from "./scripts/data/distributions.nya"
import s10 from "./scripts/4d/two-complex.nya"
import s11 from "./scripts/4d/point.nya"
import s12 from "./scripts/color/extras.nya"
import s13 from "./scripts/color/oklab.nya"
import s14 from "./scripts/color/core.nya"
import s15 from "./scripts/core/cmp.nya"
import s16 from "./scripts/core/ops.nya"
import s17 from "./scripts/3d/point.nya"

export const SCRIPTS = new Map([
  ["numtheory-real", s0],
  ["real", s1],
  ["complex", s2],
  ["point", s3],
  ["color", s4],
  ["erf", s5],
  ["numtheory-complex", s6],
  ["geometry", s7],
  ["gamma", s8],
  ["data/distributions", s9],
  ["4d/two-complex", s10],
  ["4d/point", s11],
  ["color/extras", s12],
  ["color/oklab", s13],
  ["color/core", s14],
  ["core/cmp", s15],
  ["core/ops", s16],
  ["3d/point", s17],
])

export type ScriptName =
  | "numtheory-real"
  | "real"
  | "complex"
  | "point"
  | "color"
  | "erf"
  | "numtheory-complex"
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
