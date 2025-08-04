import s0 from "../../lib/special.nya"
import s1 from "../../lib/components.nya"
import s2 from "../../lib/2d/point.nya"
import s3 from "../../lib/2d/geo.nya"
import s4 from "../../lib/data/distributions.nya"
import s5 from "../../lib/data/stats/real.nya"
import s6 from "../../lib/data/stats/complex.nya"
import s7 from "../../lib/@DEV/std.nya"
import s8 from "../../lib/@DEV/mean.nya"
import s9 from "../../lib/4d/two-complex.nya"
import s10 from "../../lib/4d/point.nya"
import s11 from "../../lib/4d/quaternion.nya"
import s12 from "../../lib/color/dcg.nya"
import s13 from "../../lib/color/index.nya"
import s14 from "../../lib/color/extras.nya"
import s15 from "../../lib/color/oklab.nya"
import s16 from "../../lib/color/core.nya"
import s17 from "../../lib/real/parity.nya"
import s18 from "../../lib/real/index.nya"
import s19 from "../../lib/real/trig-hyperbolic.nya"
import s20 from "../../lib/real/trig.nya"
import s21 from "../../lib/real/erf.nya"
import s22 from "../../lib/real/number-theory.nya"
import s23 from "../../lib/complex/index.nya"
import s24 from "../../lib/complex/trig-hyperbolic.nya"
import s25 from "../../lib/complex/trig.nya"
import s26 from "../../lib/complex/erf.nya"
import s27 from "../../lib/complex/beta.nya"
import s28 from "../../lib/complex/zeta.nya"
import s29 from "../../lib/complex/number-theory.nya"
import s30 from "../../lib/core/cmp.nya"
import s31 from "../../lib/core/ops.nya"
import s32 from "../../lib/3d/point.nya"
import s33 from "../../lib/3d/geo/index.nya"
import s34 from "../../lib/3d/geo/cons.nya"
import s35 from "../../lib/3d/geo/2d.nya"
import s36 from "../../lib/3d/geo/defs.nya"
import s37 from "../../lib/gamma/lngamma.nya"
import s38 from "../../lib/gamma/trigamma.nya"
import s39 from "../../lib/gamma/digamma.nya"
import s40 from "../../lib/gamma/factorial.nya"
import s41 from "../../lib/gamma/polygamma.nya"
import s42 from "../../lib/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["special", s0],
  ["components", s1],
  ["2d/point", s2],
  ["2d/geo", s3],
  ["data/distributions", s4],
  ["data/stats/real", s5],
  ["data/stats/complex", s6],
  ["@DEV/std", s7],
  ["@DEV/mean", s8],
  ["4d/two-complex", s9],
  ["4d/point", s10],
  ["4d/quaternion", s11],
  ["color/dcg", s12],
  ["color", s13],
  ["color/extras", s14],
  ["color/oklab", s15],
  ["color/core", s16],
  ["real/parity", s17],
  ["real", s18],
  ["real/trig-hyperbolic", s19],
  ["real/trig", s20],
  ["real/erf", s21],
  ["real/number-theory", s22],
  ["complex", s23],
  ["complex/trig-hyperbolic", s24],
  ["complex/trig", s25],
  ["complex/erf", s26],
  ["complex/beta", s27],
  ["complex/zeta", s28],
  ["complex/number-theory", s29],
  ["core/cmp", s30],
  ["core/ops", s31],
  ["3d/point", s32],
  ["3d/geo", s33],
  ["3d/geo/cons", s34],
  ["3d/geo/2d", s35],
  ["3d/geo/defs", s36],
  ["gamma/lngamma", s37],
  ["gamma/trigamma", s38],
  ["gamma/digamma", s39],
  ["gamma/factorial", s40],
  ["gamma/polygamma", s41],
  ["gamma/gamma", s42],
])

export const SCRIPT_INDICES = new Set(["color","real","complex","3d/geo",])

export type ScriptName =
  | "special"
  | "components"
  | "2d/point"
  | "2d/geo"
  | "data/distributions"
  | "data/stats/real"
  | "data/stats/complex"
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
  | "3d/geo"
  | "3d/geo/cons"
  | "3d/geo/2d"
  | "3d/geo/defs"
  | "gamma/lngamma"
  | "gamma/trigamma"
  | "gamma/digamma"
  | "gamma/factorial"
  | "gamma/polygamma"
  | "gamma/gamma"
