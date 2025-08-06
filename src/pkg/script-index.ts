import s0 from "../../lib/special.nya"
import s1 from "../../lib/components.nya"
import s2 from "../../lib/2d/point.nya"
import s3 from "../../lib/2d/geo/index.nya"
import s4 from "../../lib/2d/geo/ray.nya"
import s5 from "../../lib/2d/geo/arc.nya"
import s6 from "../../lib/2d/geo/complex/index.nya"
import s7 from "../../lib/2d/geo/complex/algebra.nya"
import s8 from "../../lib/2d/geo/complex/lircle.nya"
import s9 from "../../lib/2d/geo/complex/core.nya"
import s10 from "../../lib/data/distributions.nya"
import s11 from "../../lib/data/stats/real.nya"
import s12 from "../../lib/data/stats/complex.nya"
import s13 from "../../lib/@DEV/std.nya"
import s14 from "../../lib/@DEV/mean.nya"
import s15 from "../../lib/4d/two-complex.nya"
import s16 from "../../lib/4d/point.nya"
import s17 from "../../lib/4d/quaternion.nya"
import s18 from "../../lib/color/dcg.nya"
import s19 from "../../lib/color/index.nya"
import s20 from "../../lib/color/extras.nya"
import s21 from "../../lib/color/oklab.nya"
import s22 from "../../lib/color/core.nya"
import s23 from "../../lib/real/parity.nya"
import s24 from "../../lib/real/index.nya"
import s25 from "../../lib/real/trig-hyperbolic.nya"
import s26 from "../../lib/real/trig.nya"
import s27 from "../../lib/real/erf.nya"
import s28 from "../../lib/real/number-theory.nya"
import s29 from "../../lib/complex/index.nya"
import s30 from "../../lib/complex/trig-hyperbolic.nya"
import s31 from "../../lib/complex/trig.nya"
import s32 from "../../lib/complex/erf.nya"
import s33 from "../../lib/complex/beta.nya"
import s34 from "../../lib/complex/zeta.nya"
import s35 from "../../lib/complex/number-theory.nya"
import s36 from "../../lib/core/bool.nya"
import s37 from "../../lib/core/cmp.nya"
import s38 from "../../lib/core/ops.nya"
import s39 from "../../lib/3d/point.nya"
import s40 from "../../lib/3d/geo/index.nya"
import s41 from "../../lib/3d/geo/cons.nya"
import s42 from "../../lib/3d/geo/2d.nya"
import s43 from "../../lib/3d/geo/defs.nya"
import s44 from "../../lib/gamma/lngamma.nya"
import s45 from "../../lib/gamma/trigamma.nya"
import s46 from "../../lib/gamma/digamma.nya"
import s47 from "../../lib/gamma/factorial.nya"
import s48 from "../../lib/gamma/polygamma.nya"
import s49 from "../../lib/gamma/gamma.nya"

export const SCRIPTS = new Map([
  ["special", s0],
  ["components", s1],
  ["2d/point", s2],
  ["2d/geo", s3],
  ["2d/geo/ray", s4],
  ["2d/geo/arc", s5],
  ["2d/geo/complex", s6],
  ["2d/geo/complex/algebra", s7],
  ["2d/geo/complex/lircle", s8],
  ["2d/geo/complex/core", s9],
  ["data/distributions", s10],
  ["data/stats/real", s11],
  ["data/stats/complex", s12],
  ["@DEV/std", s13],
  ["@DEV/mean", s14],
  ["4d/two-complex", s15],
  ["4d/point", s16],
  ["4d/quaternion", s17],
  ["color/dcg", s18],
  ["color", s19],
  ["color/extras", s20],
  ["color/oklab", s21],
  ["color/core", s22],
  ["real/parity", s23],
  ["real", s24],
  ["real/trig-hyperbolic", s25],
  ["real/trig", s26],
  ["real/erf", s27],
  ["real/number-theory", s28],
  ["complex", s29],
  ["complex/trig-hyperbolic", s30],
  ["complex/trig", s31],
  ["complex/erf", s32],
  ["complex/beta", s33],
  ["complex/zeta", s34],
  ["complex/number-theory", s35],
  ["core/bool", s36],
  ["core/cmp", s37],
  ["core/ops", s38],
  ["3d/point", s39],
  ["3d/geo", s40],
  ["3d/geo/cons", s41],
  ["3d/geo/2d", s42],
  ["3d/geo/defs", s43],
  ["gamma/lngamma", s44],
  ["gamma/trigamma", s45],
  ["gamma/digamma", s46],
  ["gamma/factorial", s47],
  ["gamma/polygamma", s48],
  ["gamma/gamma", s49],
])

export const SCRIPT_INDICES = new Set(["2d/geo","2d/geo/complex","color","real","complex","3d/geo",])

export type ScriptName =
  | "special"
  | "components"
  | "2d/point"
  | "2d/geo"
  | "2d/geo/ray"
  | "2d/geo/arc"
  | "2d/geo/complex"
  | "2d/geo/complex/algebra"
  | "2d/geo/complex/lircle"
  | "2d/geo/complex/core"
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
