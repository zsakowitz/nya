import { NyaApi } from "!/emit/api"
import PKG_SURREAL from "../nya/woc/surreal"
import {
  NYALANG_PACKAGES_ADDONS,
  NYALANG_PACKAGES_BUILTIN,
} from "./index-nyalang"
import type { Addon, Package } from "./types"

type IndexOf<T> = Record<PackageId, () => Promise<{ default: T }>>

type IndexPartial = Partial<IndexOf<Package>>
type IndexAddons = Partial<IndexOf<Addon>>
type Index = IndexOf<Package>

const rawBuiltin = NYALANG_PACKAGES_BUILTIN
rawBuiltin["nya:surreal"] = () =>
  Promise.resolve({
    default: {
      name: "surreal numbeers",
      label: "<TODO: no label>",
      category: "auto-generated (nyalang)",
      deps: [],
      init: {
        intents: ["intent 1"],
        fn(sheet) {
          const api1 = new NyaApi(sheet.factory.env.libJs)
          PKG_SURREAL.load(api1)
          const api2 = new NyaApi(sheet.factory.env.libGl)
          PKG_SURREAL.load(api2)
        },
      },
    } satisfies Package,
  })

const rawAddons = NYALANG_PACKAGES_ADDONS

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
