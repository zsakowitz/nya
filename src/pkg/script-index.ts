import s0 from "../../lib/point.nya"
import s1 from "../../lib/special.nya"
import s2 from "../../lib/components.nya"
import s3 from "../../lib/geometry.nya"
import s4 from "../../lib/data/distributions.nya"
import s5 from "../../lib/data/stats.nya"
import s6 from "../../lib/@DEV/std.nya"
import s7 from "../../lib/@DEV/mean.nya"
import s8 from "../../lib/4d/two-complex.nya"
import s9 from "../../lib/4d/point.nya"
import s10 from "../../lib/4d/quaternion.nya"
import s11 from "../../lib/color/dcg.nya"
import s12 from "../../lib/color/index.nya"
import s13 from "../../lib/color/extras.nya"
import s14 from "../../lib/color/oklab.nya"
import s15 from "../../lib/color/core.nya"
import s16 from "../../lib/real/parity.nya"
import s17 from "../../lib/real/index.nya"
import s18 from "../../lib/real/trig-hyperbolic.nya"
import s19 from "../../lib/real/trig.nya"
import s20 from "../../lib/real/erf.nya"
import s21 from "../../lib/real/number-theory.nya"
import s22 from "../../lib/complex/index.nya"
import s23 from "../../lib/complex/trig-hyperbolic.nya"
import s24 from "../../lib/complex/trig.nya"
import s25 from "../../lib/complex/erf.nya"
import s26 from "../../lib/complex/beta.nya"
import s27 from "../../lib/complex/zeta.nya"
import s28 from "../../lib/complex/number-theory.nya"
import s29 from "../../lib/core/cmp.nya"
import s30 from "../../lib/core/ops.nya"
import s31 from "../../lib/3d/point.nya"
import s32 from "../../lib/gamma/lngamma.nya"
import s33 from "../../lib/gamma/trigamma.nya"
import s34 from "../../lib/gamma/digamma.nya"
import s35 from "../../lib/gamma/factorial.nya"
import s36 from "../../lib/gamma/polygamma.nya"
import s37 from "../../lib/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["point", s0],
  ["special", s1],
  ["components", s2],
  ["geometry", s3],
  ["data/distributions", s4],
  ["data/stats", s5],
  ["@DEV/std", s6],
  ["@DEV/mean", s7],
  ["4d/two-complex", s8],
  ["4d/point", s9],
  ["4d/quaternion", s10],
  ["color/dcg", s11],
  ["color", s12],
  ["color/extras", s13],
  ["color/oklab", s14],
  ["color/core", s15],
  ["real/parity", s16],
  ["real", s17],
  ["real/trig-hyperbolic", s18],
  ["real/trig", s19],
  ["real/erf", s20],
  ["real/number-theory", s21],
  ["complex", s22],
  ["complex/trig-hyperbolic", s23],
  ["complex/trig", s24],
  ["complex/erf", s25],
  ["complex/beta", s26],
  ["complex/zeta", s27],
  ["complex/number-theory", s28],
  ["core/cmp", s29],
  ["core/ops", s30],
  ["3d/point", s31],
  ["gamma/lngamma", s32],
  ["gamma/trigamma", s33],
  ["gamma/digamma", s34],
  ["gamma/factorial", s35],
  ["gamma/polygamma", s36],
  ["gamma/gamma", s37],
])

export const SCRIPT_INDICES = new Set(["color","real","complex",])

export type ScriptName =
  | "point"
  | "special"
  | "components"
  | "geometry"
  | "data/distributions"
  | "data/stats"
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
