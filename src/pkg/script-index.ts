import s0 from "../../lib/special.nya"
import s1 from "../../lib/components.nya"
import s2 from "../../lib/2d/point.nya"
import s3 from "../../lib/2d/geo/index.nya"
import s4 from "../../lib/2d/geo/complex.nya"
import s5 from "../../lib/2d/geo/complex-algebra.nya"
import s6 from "../../lib/data/distributions.nya"
import s7 from "../../lib/data/stats/real.nya"
import s8 from "../../lib/data/stats/complex.nya"
import s9 from "../../lib/@DEV/std.nya"
import s10 from "../../lib/@DEV/mean.nya"
import s11 from "../../lib/4d/two-complex.nya"
import s12 from "../../lib/4d/point.nya"
import s13 from "../../lib/4d/quaternion.nya"
import s14 from "../../lib/color/dcg.nya"
import s15 from "../../lib/color/index.nya"
import s16 from "../../lib/color/extras.nya"
import s17 from "../../lib/color/oklab.nya"
import s18 from "../../lib/color/core.nya"
import s19 from "../../lib/real/parity.nya"
import s20 from "../../lib/real/index.nya"
import s21 from "../../lib/real/trig-hyperbolic.nya"
import s22 from "../../lib/real/trig.nya"
import s23 from "../../lib/real/erf.nya"
import s24 from "../../lib/real/number-theory.nya"
import s25 from "../../lib/complex/index.nya"
import s26 from "../../lib/complex/trig-hyperbolic.nya"
import s27 from "../../lib/complex/trig.nya"
import s28 from "../../lib/complex/erf.nya"
import s29 from "../../lib/complex/beta.nya"
import s30 from "../../lib/complex/zeta.nya"
import s31 from "../../lib/complex/number-theory.nya"
import s32 from "../../lib/core/bool.nya"
import s33 from "../../lib/core/cmp.nya"
import s34 from "../../lib/core/ops.nya"
import s35 from "../../lib/3d/point.nya"
import s36 from "../../lib/3d/geo/index.nya"
import s37 from "../../lib/3d/geo/cons.nya"
import s38 from "../../lib/3d/geo/2d.nya"
import s39 from "../../lib/3d/geo/defs.nya"
import s40 from "../../lib/gamma/lngamma.nya"
import s41 from "../../lib/gamma/trigamma.nya"
import s42 from "../../lib/gamma/digamma.nya"
import s43 from "../../lib/gamma/factorial.nya"
import s44 from "../../lib/gamma/polygamma.nya"
import s45 from "../../lib/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["special", s0],
  ["components", s1],
  ["2d/point", s2],
  ["2d/geo", s3],
  ["2d/geo/complex", s4],
  ["2d/geo/complex-algebra", s5],
  ["data/distributions", s6],
  ["data/stats/real", s7],
  ["data/stats/complex", s8],
  ["@DEV/std", s9],
  ["@DEV/mean", s10],
  ["4d/two-complex", s11],
  ["4d/point", s12],
  ["4d/quaternion", s13],
  ["color/dcg", s14],
  ["color", s15],
  ["color/extras", s16],
  ["color/oklab", s17],
  ["color/core", s18],
  ["real/parity", s19],
  ["real", s20],
  ["real/trig-hyperbolic", s21],
  ["real/trig", s22],
  ["real/erf", s23],
  ["real/number-theory", s24],
  ["complex", s25],
  ["complex/trig-hyperbolic", s26],
  ["complex/trig", s27],
  ["complex/erf", s28],
  ["complex/beta", s29],
  ["complex/zeta", s30],
  ["complex/number-theory", s31],
  ["core/bool", s32],
  ["core/cmp", s33],
  ["core/ops", s34],
  ["3d/point", s35],
  ["3d/geo", s36],
  ["3d/geo/cons", s37],
  ["3d/geo/2d", s38],
  ["3d/geo/defs", s39],
  ["gamma/lngamma", s40],
  ["gamma/trigamma", s41],
  ["gamma/digamma", s42],
  ["gamma/factorial", s43],
  ["gamma/polygamma", s44],
  ["gamma/gamma", s45],
])

export const SCRIPT_INDICES = new Set(["2d/geo","color","real","complex","3d/geo",])

export type ScriptName =
  | "special"
  | "components"
  | "2d/point"
  | "2d/geo"
  | "2d/geo/complex"
  | "2d/geo/complex-algebra"
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
  | "core/bool"
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
