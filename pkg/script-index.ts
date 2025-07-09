import s0 from "../nya/point.nya"
import s1 from "../nya/special.nya"
import s2 from "../nya/components.nya"
import s3 from "../nya/geometry.nya"
import s4 from "../nya/data/distributions.nya"
import s5 from "../nya/@DEV/anyarray.nya"
import s6 from "../nya/4d/two-complex.nya"
import s7 from "../nya/4d/point.nya"
import s8 from "../nya/4d/quaternion.nya"
import s9 from "../nya/color/dcg.nya"
import s10 from "../nya/color/index.nya"
import s11 from "../nya/color/extras.nya"
import s12 from "../nya/color/oklab.nya"
import s13 from "../nya/color/core.nya"
import s14 from "../nya/real/parity.nya"
import s15 from "../nya/real/index.nya"
import s16 from "../nya/real/trig-hyperbolic.nya"
import s17 from "../nya/real/trig.nya"
import s18 from "../nya/real/erf.nya"
import s19 from "../nya/real/number-theory.nya"
import s20 from "../nya/complex/index.nya"
import s21 from "../nya/complex/trig-hyperbolic.nya"
import s22 from "../nya/complex/trig.nya"
import s23 from "../nya/complex/erf.nya"
import s24 from "../nya/complex/beta.nya"
import s25 from "../nya/complex/zeta.nya"
import s26 from "../nya/complex/number-theory.nya"
import s27 from "../nya/core/cmp.nya"
import s28 from "../nya/core/ops.nya"
import s29 from "../nya/3d/point.nya"
import s30 from "../nya/gamma/lngamma.nya"
import s31 from "../nya/gamma/trigamma.nya"
import s32 from "../nya/gamma/digamma.nya"
import s33 from "../nya/gamma/factorial.nya"
import s34 from "../nya/gamma/polygamma.nya"
import s35 from "../nya/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["point", s0],
  ["special", s1],
  ["components", s2],
  ["geometry", s3],
  ["data/distributions", s4],
  ["@DEV/anyarray", s5],
  ["4d/two-complex", s6],
  ["4d/point", s7],
  ["4d/quaternion", s8],
  ["color/dcg", s9],
  ["color", s10],
  ["color/extras", s11],
  ["color/oklab", s12],
  ["color/core", s13],
  ["real/parity", s14],
  ["real", s15],
  ["real/trig-hyperbolic", s16],
  ["real/trig", s17],
  ["real/erf", s18],
  ["real/number-theory", s19],
  ["complex", s20],
  ["complex/trig-hyperbolic", s21],
  ["complex/trig", s22],
  ["complex/erf", s23],
  ["complex/beta", s24],
  ["complex/zeta", s25],
  ["complex/number-theory", s26],
  ["core/cmp", s27],
  ["core/ops", s28],
  ["3d/point", s29],
  ["gamma/lngamma", s30],
  ["gamma/trigamma", s31],
  ["gamma/digamma", s32],
  ["gamma/factorial", s33],
  ["gamma/polygamma", s34],
  ["gamma/gamma", s35],
])

export const SCRIPT_INDICES = new Set(["color","real","complex",])

export type ScriptName =
  | "point"
  | "special"
  | "components"
  | "geometry"
  | "data/distributions"
  | "@DEV/anyarray"
  | "4d/two-complex"
  | "4d/point"
  | "4d/quaternion"
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
