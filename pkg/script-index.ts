import s0 from "../nya/point.nya"
import s1 from "../nya/color.nya"
import s2 from "../nya/erf.nya"
import s3 from "../nya/geometry.nya"
import s4 from "../nya/data/distributions.nya"
import s5 from "../nya/4d/two-complex.nya"
import s6 from "../nya/4d/point.nya"
import s7 from "../nya/color/extras.nya"
import s8 from "../nya/color/oklab.nya"
import s9 from "../nya/color/core.nya"
import s10 from "../nya/real/index.nya"
import s11 from "../nya/real/number-theory.nya"
import s12 from "../nya/complex/index.nya"
import s13 from "../nya/complex/trig-hyperbolic.nya"
import s14 from "../nya/complex/trig.nya"
import s15 from "../nya/complex/number-theory.nya"
import s16 from "../nya/core/cmp.nya"
import s17 from "../nya/core/ops.nya"
import s18 from "../nya/3d/point.nya"
import s19 from "../nya/gamma/lngamma.nya"
import s20 from "../nya/gamma/digamma.nya"
import s21 from "../nya/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["point", s0],
  ["color", s1],
  ["erf", s2],
  ["geometry", s3],
  ["data/distributions", s4],
  ["4d/two-complex", s5],
  ["4d/point", s6],
  ["color/extras", s7],
  ["color/oklab", s8],
  ["color/core", s9],
  ["real", s10],
  ["real/number-theory", s11],
  ["complex", s12],
  ["complex/trig-hyperbolic", s13],
  ["complex/trig", s14],
  ["complex/number-theory", s15],
  ["core/cmp", s16],
  ["core/ops", s17],
  ["3d/point", s18],
  ["gamma/lngamma", s19],
  ["gamma/digamma", s20],
  ["gamma/gamma", s21],
])

export type ScriptName =
  | "point"
  | "color"
  | "erf"
  | "geometry"
  | "data/distributions"
  | "4d/two-complex"
  | "4d/point"
  | "color/extras"
  | "color/oklab"
  | "color/core"
  | "real"
  | "real/number-theory"
  | "complex"
  | "complex/trig-hyperbolic"
  | "complex/trig"
  | "complex/number-theory"
  | "core/cmp"
  | "core/ops"
  | "3d/point"
  | "gamma/lngamma"
  | "gamma/digamma"
  | "gamma/gamma"
