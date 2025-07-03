import s0 from "../nya/point.nya"
import s1 from "../nya/special.nya"
import s2 from "../nya/geometry.nya"
import s3 from "../nya/data/distributions.nya"
import s4 from "../nya/4d/two-complex.nya"
import s5 from "../nya/4d/point.nya"
import s6 from "../nya/color/dcg.nya"
import s7 from "../nya/color/index.nya"
import s8 from "../nya/color/extras.nya"
import s9 from "../nya/color/oklab.nya"
import s10 from "../nya/color/core.nya"
import s11 from "../nya/real/parity.nya"
import s12 from "../nya/real/index.nya"
import s13 from "../nya/real/trig-hyperbolic.nya"
import s14 from "../nya/real/trig.nya"
import s15 from "../nya/real/erf.nya"
import s16 from "../nya/real/number-theory.nya"
import s17 from "../nya/complex/index.nya"
import s18 from "../nya/complex/trig-hyperbolic.nya"
import s19 from "../nya/complex/trig.nya"
import s20 from "../nya/complex/erf.nya"
import s21 from "../nya/complex/beta.nya"
import s22 from "../nya/complex/zeta.nya"
import s23 from "../nya/complex/number-theory.nya"
import s24 from "../nya/core/cmp.nya"
import s25 from "../nya/core/ops.nya"
import s26 from "../nya/3d/point.nya"
import s27 from "../nya/gamma/lngamma.nya"
import s28 from "../nya/gamma/trigamma.nya"
import s29 from "../nya/gamma/digamma.nya"
import s30 from "../nya/gamma/factorial.nya"
import s31 from "../nya/gamma/polygamma.nya"
import s32 from "../nya/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["point", s0],
  ["special", s1],
  ["geometry", s2],
  ["data/distributions", s3],
  ["4d/two-complex", s4],
  ["4d/point", s5],
  ["color/dcg", s6],
  ["color", s7],
  ["color/extras", s8],
  ["color/oklab", s9],
  ["color/core", s10],
  ["real/parity", s11],
  ["real", s12],
  ["real/trig-hyperbolic", s13],
  ["real/trig", s14],
  ["real/erf", s15],
  ["real/number-theory", s16],
  ["complex", s17],
  ["complex/trig-hyperbolic", s18],
  ["complex/trig", s19],
  ["complex/erf", s20],
  ["complex/beta", s21],
  ["complex/zeta", s22],
  ["complex/number-theory", s23],
  ["core/cmp", s24],
  ["core/ops", s25],
  ["3d/point", s26],
  ["gamma/lngamma", s27],
  ["gamma/trigamma", s28],
  ["gamma/digamma", s29],
  ["gamma/factorial", s30],
  ["gamma/polygamma", s31],
  ["gamma/gamma", s32],
])

export const SCRIPT_INDICES = new Set(["color","real","complex",])

export type ScriptName =
  | "point"
  | "special"
  | "geometry"
  | "data/distributions"
  | "4d/two-complex"
  | "4d/point"
  | "color/dcg"
  | "color"
  | "color/extras"
  | "color/oklab"
  | "color/core"
  | "real/parity"
  | "real"
  | "real/trig-hyperbolic"
  | "real/trig"
  | "real/erf"
  | "real/number-theory"
  | "complex"
  | "complex/trig-hyperbolic"
  | "complex/trig"
  | "complex/erf"
  | "complex/beta"
  | "complex/zeta"
  | "complex/number-theory"
  | "core/cmp"
  | "core/ops"
  | "3d/point"
  | "gamma/lngamma"
  | "gamma/trigamma"
  | "gamma/digamma"
  | "gamma/factorial"
  | "gamma/polygamma"
  | "gamma/gamma"
