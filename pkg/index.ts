import type { Package } from "./types"

export const index = {
  "3d/point": () => import("$/3d/point"),
  "4d/point": () => import("$/4d/point"),
  "base": () => import("$/base"),
  "bool": () => import("$/bool"),
  "chem/elements": () => import("$/chem/elements"),
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
  "debug": () => import("$/debug"),
  "eval": () => import("$/eval"),
  "factorial": () => import("$/factorial"),
  "geo/dcg": () => import("$/geo/dcg"),
  "geo/image": () => import("$/geo/image"),
  "geo/point": () => import("$/geo/point"),
  "gridlines": () => import("$/gridlines"),
  "image": () => import("$/image"),
  "item/docs-fn": () => import("$/item/docs-fn"),
  "item/folder": () => import("$/item/folder"),
  "item/note": () => import("$/item/note"),
  "iterate": () => import("$/iterate"),
  "ithkuil": () => import("$/ithkuil"),
  "num/complex": () => import("$/num/complex"),
  "num/quaternion": () => import("$/num/quaternion"),
  "num/real": () => import("$/num/real"),
  "number-theory": () => import("$/number-theory"),
  "number-theory-complex": () => import("$/number-theory-complex"),
  "shader": () => import("$/shader"),
  "slider": () => import("$/slider"),
  "slope-field": () => import("$/slope-field"),
  "special": () => import("$/special"),
  "sym/core": () => import("$/sym/core"),
  "sym/deriv": () => import("$/sym/deriv"),
  "sym/extras": () => import("$/sym/extras"),
  "text": () => import("$/text"),
  "trig/complex": () => import("$/trig/complex"),
  "trig/hyperbolic/real": () => import("$/trig/hyperbolic/real"),
  "trig/hyperbolic/complex": () => import("$/trig/hyperbolic/complex"),
  "trig/real": () => import("$/trig/real"),
  "unit/pkg": () => import("$/unit/pkg"),
  "with": () => import("$/with"),
  "withseq": () => import("$/withseq"),
}
Object.setPrototypeOf(index, null)

// satisfies cannot be inline b/c it causes type errors
index satisfies Record<string, () => Promise<{ default: Package }>>

export type PackageId = keyof typeof index

export async function all(): Promise<Package[]> {
  return await Promise.all(
    Object.values(index).map(async (x) => (await x()).default),
  )
}
