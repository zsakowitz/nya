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
import s10 from "../nya/real/parity.nya"
import s11 from "../nya/real/index.nya"
import s12 from "../nya/real/number-theory.nya"
import s13 from "../nya/complex/index.nya"
import s14 from "../nya/complex/trig-hyperbolic.nya"
import s15 from "../nya/complex/trig.nya"
import s16 from "../nya/complex/number-theory.nya"
import s17 from "../nya/core/cmp.nya"
import s18 from "../nya/core/ops.nya"
import s19 from "../nya/3d/point.nya"
import s20 from "../nya/gamma/lngamma.nya"
import s21 from "../nya/gamma/trigamma.nya"
import s22 from "../nya/gamma/digamma.nya"
import s23 from "../nya/gamma/polygamma.nya"
import s24 from "../nya/gamma/gamma.nya"

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
  ["real/parity", s10],
  ["real", s11],
  ["real/number-theory", s12],
  ["complex", s13],
  ["complex/trig-hyperbolic", s14],
  ["complex/trig", s15],
  ["complex/number-theory", s16],
  ["core/cmp", s17],
  ["core/ops", s18],
  ["3d/point", s19],
  ["gamma/lngamma", s20],
  ["gamma/trigamma", s21],
  ["gamma/digamma", s22],
  ["gamma/polygamma", s23],
  ["gamma/gamma", s24],
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
  | "real/parity"
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
  | "gamma/trigamma"
  | "gamma/digamma"
  | "gamma/polygamma"
  | "gamma/gamma"
