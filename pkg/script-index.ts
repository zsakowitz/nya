import s0 from "../nya/point.nya"
import s1 from "../nya/geometry.nya"
import s2 from "../nya/data/distributions.nya"
import s3 from "../nya/4d/two-complex.nya"
import s4 from "../nya/4d/point.nya"
import s5 from "../nya/color/index.nya"
import s6 from "../nya/color/extras.nya"
import s7 from "../nya/color/oklab.nya"
import s8 from "../nya/color/core.nya"
import s9 from "../nya/real/parity.nya"
import s10 from "../nya/real/index.nya"
import s11 from "../nya/real/erf.nya"
import s12 from "../nya/real/zeta.nya"
import s13 from "../nya/real/number-theory.nya"
import s14 from "../nya/complex/index.nya"
import s15 from "../nya/complex/trig-hyperbolic.nya"
import s16 from "../nya/complex/trig.nya"
import s17 from "../nya/complex/number-theory.nya"
import s18 from "../nya/core/cmp.nya"
import s19 from "../nya/core/ops.nya"
import s20 from "../nya/3d/point.nya"
import s21 from "../nya/gamma/lngamma.nya"
import s22 from "../nya/gamma/trigamma.nya"
import s23 from "../nya/gamma/digamma.nya"
import s24 from "../nya/gamma/polygamma.nya"
import s25 from "../nya/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["point", s0],
  ["geometry", s1],
  ["data/distributions", s2],
  ["4d/two-complex", s3],
  ["4d/point", s4],
  ["color", s5],
  ["color/extras", s6],
  ["color/oklab", s7],
  ["color/core", s8],
  ["real/parity", s9],
  ["real", s10],
  ["real/erf", s11],
  ["real/zeta", s12],
  ["real/number-theory", s13],
  ["complex", s14],
  ["complex/trig-hyperbolic", s15],
  ["complex/trig", s16],
  ["complex/number-theory", s17],
  ["core/cmp", s18],
  ["core/ops", s19],
  ["3d/point", s20],
  ["gamma/lngamma", s21],
  ["gamma/trigamma", s22],
  ["gamma/digamma", s23],
  ["gamma/polygamma", s24],
  ["gamma/gamma", s25],
])

export type ScriptName =
  | "point"
  | "geometry"
  | "data/distributions"
  | "4d/two-complex"
  | "4d/point"
  | "color"
  | "color/extras"
  | "color/oklab"
  | "color/core"
  | "real/parity"
  | "real"
  | "real/erf"
  | "real/zeta"
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
