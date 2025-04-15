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
] as const

export type ManifestFnKindName = (typeof manifestFnKinds)[number]
export type ManifestFnKindIndex = keyof typeof manifestFnKinds

export type ManifestFn = [
  name: string,
  label: string,
  refs: PackageIndex[],
  kind: ManifestFnKindIndex,
]

export interface Manifest {
  packages: PackageId[]

  /** Key => array of possible results */
  fns: Record<string, ManifestFn[]>
}
