import s0 from "../nya/numtheory-real.nya"
import s1 from "../nya/complex-trig-hyperbolic.nya"
import s2 from "../nya/real.nya"
import s3 from "../nya/complex.nya"
import s4 from "../nya/point.nya"
import s5 from "../nya/color.nya"
import s6 from "../nya/complex-trig.nya"
import s7 from "../nya/erf.nya"
import s8 from "../nya/numtheory-complex.nya"
import s9 from "../nya/geometry.nya"
import s10 from "../nya/gamma.nya"
import s11 from "../nya/data/distributions.nya"
import s12 from "../nya/4d/two-complex.nya"
import s13 from "../nya/4d/point.nya"
import s14 from "../nya/color/extras.nya"
import s15 from "../nya/color/oklab.nya"
import s16 from "../nya/color/core.nya"
import s17 from "../nya/core/cmp.nya"
import s18 from "../nya/core/ops.nya"
import s19 from "../nya/3d/point.nya"

export const SCRIPTS = new Map([
  ["numtheory-real", s0],
  ["complex-trig-hyperbolic", s1],
  ["real", s2],
  ["complex", s3],
  ["point", s4],
  ["color", s5],
  ["complex-trig", s6],
  ["erf", s7],
  ["numtheory-complex", s8],
  ["geometry", s9],
  ["gamma", s10],
  ["data/distributions", s11],
  ["4d/two-complex", s12],
  ["4d/point", s13],
  ["color/extras", s14],
  ["color/oklab", s15],
  ["color/core", s16],
  ["core/cmp", s17],
  ["core/ops", s18],
  ["3d/point", s19],
])

export type ScriptName =
  | "numtheory-real"
  | "complex-trig-hyperbolic"
  | "real"
  | "complex"
  | "point"
  | "color"
  | "complex-trig"
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
