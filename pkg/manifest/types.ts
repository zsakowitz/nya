import type { PackageId } from ".."

export type PackageIndex = number & { readonly __package_index: unique symbol }

export const manifestFnKinds = [
  "fn/named",
  "fn/op/unary",
  "fn/op/binary",
  "op/unary",
  "op/binary",
  "magic/kw",
  "magic/fn",
  "magic/prefix",
  "var/named",
] as const

export type ManifestFnKindName = (typeof manifestFnKinds)[number]
export type ManifestFnKindIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type ManifestPackage = [
  id: PackageId,
  name: string,
  colorL: string,
  colorM: string,
  colorD: string,
  label: string | null,
  deps: PackageIndex[],
]

export type ManifestFn = [
  name: string,
  label: string,
  refs: PackageIndex[],
  kind: ManifestFnKindIndex,
  deitalicize?: true,
]

export interface Manifest {
  packages: ManifestPackage[]
  /** Key => array of possible results */
  fns: Record<string, ManifestFn[]>
}
