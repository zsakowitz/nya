import type { Package } from "./types"

export const builtin = {
  "3d/point": () => import("$/3d/point"),
  "base": () => import("$/base"),
  "bool": () => import("$/bool"),
  "color/core": () => import("$/color/core"),
  "color/extras": () => import("$/color/extras"),
  "core/cmp": () => import("$/core/cmp"),
  "core/fn": () => import("$/core/fn"),
  "core/ops": () => import("$/core/ops"),
  "data/distributions": () => import("$/data/distributions"),
  "data/list": () => import("$/data/list"),
  "data/list-extras": () => import("$/data/list-extras"),
  "data/statistics": () => import("$/data/statistics"),
  "data/statistics-complex": () => import("$/data/statistics-complex"),
  "eval": () => import("$/eval"),
  "factorial": () => import("$/factorial"),
  "geo/dcg": () => import("$/geo/dcg"),
  "geo/point": () => import("$/geo/point"),
  "gridlines": () => import("$/gridlines"),
  "item/docs-fn": () => import("$/item/docs-fn"),
  "item/folder": () => import("$/item/folder"),
  "item/note": () => import("$/item/note"),
  "iterate": () => import("$/iterate"),
  "num/complex": () => import("$/num/complex"),
  "num/real": () => import("$/num/real"),
  "number-theory": () => import("$/number-theory"),
  "number-theory-complex": () => import("$/number-theory-complex"),
  "shader": () => import("$/shader"),
  "slider": () => import("$/slider"),
  "special/erf": () => import("$/special/erf"),
  "special/erf-complex": () => import("$/special/erf-complex"),
  "sym/core": () => import("$/sym/core"),
  "sym/deriv": () => import("$/sym/deriv"),
  "sym/extras": () => import("$/sym/extras"),
  "trig/complex": () => import("$/trig/complex"),
  "trig/hyperbolic/real": () => import("$/trig/hyperbolic/real"),
  "trig/hyperbolic/complex": () => import("$/trig/hyperbolic/complex"),
  "trig/real": () => import("$/trig/real"),
  "with": () => import("$/with"),
}
Object.setPrototypeOf(builtin, null)

export const addons = {
  "4d/point": () => import("$/4d/point"),
  "chem/elements": () => import("$/chem/elements"),
  "debug": () => import("$/debug"),
  "gamma": () => import("$/gamma"),
  "geo/image": () => import("$/geo/image"),
  "image": () => import("$/image"),
  "ithkuil": () => import("$/ithkuil"),
  "num/quaternion": () => import("$/num/quaternion"),
  "slope-field": () => import("$/slope-field"),
  "special": () => import("$/special"),
  "unit/pkg": () => import("$/unit/pkg"),
  "text": () => import("$/text"),
  "withseq": () => import("$/withseq"),
}
Object.setPrototypeOf(addons, null)

export const index = {
  __proto__: null,
  ...builtin,
  ...addons,
} as typeof builtin & typeof addons

// satisfies cannot be inline b/c it causes type errors
index satisfies Record<string, () => Promise<{ default: Package }>>

export type PackageId = keyof typeof index

export async function all(): Promise<Package[]> {
  return await Promise.all(
    Object.values(builtin).map(async (x) => (await x()).default),
  )
}
