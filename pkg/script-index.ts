import s24 from "../nya/3d/point.nya"
import s4 from "../nya/4d/point.nya"
import s3 from "../nya/4d/two-complex.nya"
import s8 from "../nya/color/core.nya"
import s6 from "../nya/color/extras.nya"
import s5 from "../nya/color/index.nya"
import s7 from "../nya/color/oklab.nya"
import s19 from "../nya/complex/beta.nya"
import s18 from "../nya/complex/erf.nya"
import s15 from "../nya/complex/index.nya"
import s21 from "../nya/complex/number-theory.nya"
import s16 from "../nya/complex/trig-hyperbolic.nya"
import s17 from "../nya/complex/trig.nya"
import s20 from "../nya/complex/zeta.nya"
import s22 from "../nya/core/cmp.nya"
import s23 from "../nya/core/ops.nya"
import s2 from "../nya/data/distributions.nya"
import s27 from "../nya/gamma/digamma.nya"
import s29 from "../nya/gamma/gamma.nya"
import s25 from "../nya/gamma/lngamma.nya"
import s28 from "../nya/gamma/polygamma.nya"
import s26 from "../nya/gamma/trigamma.nya"
import s1 from "../nya/geometry.nya"
import s0 from "../nya/point.nya"
import s13 from "../nya/real/erf.nya"
import s10 from "../nya/real/index.nya"
import s14 from "../nya/real/number-theory.nya"
import s9 from "../nya/real/parity.nya"
import s11 from "../nya/real/trig-hyperbolic.nya"
import s12 from "../nya/real/trig.nya"

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
  ["real/trig-hyperbolic", s11],
  ["real/trig", s12],
  ["real/erf", s13],
  ["real/number-theory", s14],
  ["complex", s15],
  ["complex/trig-hyperbolic", s16],
  ["complex/trig", s17],
  ["complex/erf", s18],
  ["complex/beta", s19],
  ["complex/zeta", s20],
  ["complex/number-theory", s21],
  ["core/cmp", s22],
  ["core/ops", s23],
  ["3d/point", s24],
  ["gamma/lngamma", s25],
  ["gamma/trigamma", s26],
  ["gamma/digamma", s27],
  ["gamma/polygamma", s28],
  ["gamma/gamma", s29],
])

export const SCRIPT_NAMES = Array.from(SCRIPTS.keys()) as readonly ScriptName[]

export async function getScriptContent(name: ScriptName): Promise<string> {
  return SCRIPTS.get(name)!
}

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
  | "gamma/polygamma"
  | "gamma/gamma"
