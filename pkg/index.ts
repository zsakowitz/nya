import "../index.css"
import type { Addon, Package } from "./types"

export type IndexOf<T> = Record<PackageId, () => Promise<{ default: T }>>

type IndexPartial = Partial<IndexOf<Package>>
type IndexAddons = Partial<IndexOf<Addon>>
type Index = IndexOf<Package>

const rawBuiltin = {
  "__proto__": null,
  "3d/point": () => import("$/3d/point"),
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
  "trig/complex": () => import("$/trig/complex"),
  "trig/hyperbolic/real": () => import("$/trig/hyperbolic/real"),
  "trig/hyperbolic/complex": () => import("$/trig/hyperbolic/complex"),
  "trig/real": () => import("$/trig/real"),
  "with": () => import("$/with"),
}

const rawAddons = {
  "__proto__": null,
  "4d/point": () => import("$/4d/point"),
  "base": () => import("$/base"),
  "chem/elements": () => import("$/chem/elements"),
  "debug": () => import("$/debug"),
  "gamma": () => import("$/gamma"),
  "geo/dcg": () => import("$/geo/dcg"),
  "geo/image": () => import("$/geo/image"),
  "image": () => import("$/image"),
  "ithkuil": () => import("$/ithkuil"),
  "num/quaternion": () => import("$/num/quaternion"),
  "slope-field": () => import("$/slope-field"),
  "special": () => import("$/special"),
  "sym/extras": () => import("$/sym/extras"),
  "unit/pkg": () => import("$/unit/pkg"),
  "text": () => import("$/text"),
  "withseq": () => import("$/withseq"),
}

const rawIndex = {
  // @ts-expect-error TS thinks we're spreading __proto__, but that's not how __proto__ works
  __proto__: null,
  ...rawBuiltin,
  ...rawAddons,
}

// We would like to use the keys above as dependency IDs, which requires we have
// the objects untyped. This, however, means around seven files which use these
// objects will error if any single package has invalid types. To fix that, we
// perform a quick check with 'satisfies' here to ensure correct types, then
// export type-casted objects. Not perfect, but it works pretty well.

rawBuiltin satisfies IndexPartial
rawAddons satisfies IndexAddons
rawIndex satisfies Index

export const builtin = rawBuiltin as any as IndexPartial
export const addons = rawAddons as any as IndexAddons
export const index = rawIndex as any as Index

// we have to remove __proto__ because TS doesn't understand it's a special property
export type PackageId = Exclude<keyof typeof rawIndex, "__proto__">
