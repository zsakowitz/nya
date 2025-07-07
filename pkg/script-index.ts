import s0 from "../nya/point.nya"
import s1 from "../nya/special.nya"
import s2 from "../nya/geometry.nya"
import s3 from "../nya/data/distributions.nya"
import s4 from "../nya/@DEV/anyarray.nya"
import s5 from "../nya/4d/two-complex.nya"
import s6 from "../nya/4d/point.nya"
import s7 from "../nya/color/dcg.nya"
import s8 from "../nya/color/index.nya"
import s9 from "../nya/color/extras.nya"
import s10 from "../nya/color/oklab.nya"
import s11 from "../nya/color/core.nya"
import s12 from "../nya/real/parity.nya"
import s13 from "../nya/real/index.nya"
import s14 from "../nya/real/trig-hyperbolic.nya"
import s15 from "../nya/real/trig.nya"
import s16 from "../nya/real/erf.nya"
import s17 from "../nya/real/number-theory.nya"
import s18 from "../nya/complex/index.nya"
import s19 from "../nya/complex/trig-hyperbolic.nya"
import s20 from "../nya/complex/trig.nya"
import s21 from "../nya/complex/erf.nya"
import s22 from "../nya/complex/beta.nya"
import s23 from "../nya/complex/zeta.nya"
import s24 from "../nya/complex/number-theory.nya"
import s25 from "../nya/core/cmp.nya"
import s26 from "../nya/core/ops.nya"
import s27 from "../nya/3d/point.nya"
import s28 from "../nya/gamma/lngamma.nya"
import s29 from "../nya/gamma/trigamma.nya"
import s30 from "../nya/gamma/digamma.nya"
import s31 from "../nya/gamma/factorial.nya"
import s32 from "../nya/gamma/polygamma.nya"
import s33 from "../nya/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["point", s0],
  ["special", s1],
  ["geometry", s2],
  ["data/distributions", s3],
  ["@DEV/anyarray", s4],
  ["4d/two-complex", s5],
  ["4d/point", s6],
  ["color/dcg", s7],
  ["color", s8],
  ["color/extras", s9],
  ["color/oklab", s10],
  ["color/core", s11],
  ["real/parity", s12],
  ["real", s13],
  ["real/trig-hyperbolic", s14],
  ["real/trig", s15],
  ["real/erf", s16],
  ["real/number-theory", s17],
  ["complex", s18],
  ["complex/trig-hyperbolic", s19],
  ["complex/trig", s20],
  ["complex/erf", s21],
  ["complex/beta", s22],
  ["complex/zeta", s23],
  ["complex/number-theory", s24],
  ["core/cmp", s25],
  ["core/ops", s26],
  ["3d/point", s27],
  ["gamma/lngamma", s28],
  ["gamma/trigamma", s29],
  ["gamma/digamma", s30],
  ["gamma/factorial", s31],
  ["gamma/polygamma", s32],
  ["gamma/gamma", s33],
])

export const SCRIPT_INDICES = new Set(["color","real","complex",])

export type ScriptName =
  | "point"
  | "special"
  | "geometry"
  | "data/distributions"
  | "@DEV/anyarray"
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
