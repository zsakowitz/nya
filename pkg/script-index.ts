import s0 from "../nya/point.nya"
import s1 from "../nya/special.nya"
import s2 from "../nya/components.nya"
import s3 from "../nya/geometry.nya"
import s4 from "../nya/data/distributions.nya"
import s5 from "../nya/@DEV/std.nya"
import s6 from "../nya/@DEV/mean.nya"
import s7 from "../nya/4d/two-complex.nya"
import s8 from "../nya/4d/point.nya"
import s9 from "../nya/4d/quaternion.nya"
import s10 from "../nya/color/dcg.nya"
import s11 from "../nya/color/index.nya"
import s12 from "../nya/color/extras.nya"
import s13 from "../nya/color/oklab.nya"
import s14 from "../nya/color/core.nya"
import s15 from "../nya/real/parity.nya"
import s16 from "../nya/real/index.nya"
import s17 from "../nya/real/trig-hyperbolic.nya"
import s18 from "../nya/real/trig.nya"
import s19 from "../nya/real/erf.nya"
import s20 from "../nya/real/number-theory.nya"
import s21 from "../nya/complex/index.nya"
import s22 from "../nya/complex/trig-hyperbolic.nya"
import s23 from "../nya/complex/trig.nya"
import s24 from "../nya/complex/erf.nya"
import s25 from "../nya/complex/beta.nya"
import s26 from "../nya/complex/zeta.nya"
import s27 from "../nya/complex/number-theory.nya"
import s28 from "../nya/core/cmp.nya"
import s29 from "../nya/core/ops.nya"
import s30 from "../nya/3d/point.nya"
import s31 from "../nya/gamma/lngamma.nya"
import s32 from "../nya/gamma/trigamma.nya"
import s33 from "../nya/gamma/digamma.nya"
import s34 from "../nya/gamma/factorial.nya"
import s35 from "../nya/gamma/polygamma.nya"
import s36 from "../nya/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["point", s0],
  ["special", s1],
  ["components", s2],
  ["geometry", s3],
  ["data/distributions", s4],
  ["@DEV/std", s5],
  ["@DEV/mean", s6],
  ["4d/two-complex", s7],
  ["4d/point", s8],
  ["4d/quaternion", s9],
  ["color/dcg", s10],
  ["color", s11],
  ["color/extras", s12],
  ["color/oklab", s13],
  ["color/core", s14],
  ["real/parity", s15],
  ["real", s16],
  ["real/trig-hyperbolic", s17],
  ["real/trig", s18],
  ["real/erf", s19],
  ["real/number-theory", s20],
  ["complex", s21],
  ["complex/trig-hyperbolic", s22],
  ["complex/trig", s23],
  ["complex/erf", s24],
  ["complex/beta", s25],
  ["complex/zeta", s26],
  ["complex/number-theory", s27],
  ["core/cmp", s28],
  ["core/ops", s29],
  ["3d/point", s30],
  ["gamma/lngamma", s31],
  ["gamma/trigamma", s32],
  ["gamma/digamma", s33],
  ["gamma/factorial", s34],
  ["gamma/polygamma", s35],
  ["gamma/gamma", s36],
])

export const SCRIPT_INDICES = new Set(["color","real","complex",])

export type ScriptName =
  | "point"
  | "special"
  | "components"
  | "geometry"
  | "data/distributions"
  | "@DEV/std"
  | "@DEV/mean"
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
