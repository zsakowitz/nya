import { addons } from "#/index"
import { manifest } from "#/manifest/data"
import type { ManifestPackage, PackageIndex } from "#/manifest/types"

function allDeps(pkg: ManifestPackage) {
  const deps = new Set(pkg[6])
  let prev = 0
  while (prev != deps.size) {
    prev = deps.size
    for (const dep of deps) {
      const next = manifest.packages[dep]?.[6]
      if (next) {
        for (const dep of next) {
          deps.add(dep)
        }
      }
    }
  }
  return deps
}

export const pkgs = manifest.packages
  .map((x, i) => ({ i: i as PackageIndex, x }))
  .filter((x) => x.x[0] in addons)

function get() {
  if (!globalThis.location) return []
  const value = new URLSearchParams(location.search).get("addons")
  if (!value) return []
  return value
    .split(",")
    .filter((x) => x in addons)
    .map((n) => pkgs.find((x) => x.x[0] == n)?.i)
    .filter((x) => x != null)
    .filter((x, i, a) => a.indexOf(x) == i)
}

export function getAll() {
  const list = get()
  const deps = list
    .map((src) =>
      Array.from(allDeps(manifest.packages[src]!))
        .filter((x) => manifest.packages[x]![0] in addons)
        .map((dep) => ({ src, dep })),
    )
    .flat()
  const extras: Record<PackageIndex, PackageIndex[]> = Object.create(null)
  for (const el of list) {
    extras[el] = []
  }
  for (const { src, dep } of deps) {
    ;(extras[dep] ??= []).push(src)
  }
  return Object.entries(extras).map(([index, dependents]) => ({
    index: +index as PackageIndex,
    dependents,
    selected: list.includes(+index as PackageIndex),
  }))
}
