import type { Package } from "#/types"
import type { PackageId } from ".."

export function order(packages: { id: PackageId; pkg: Package }[]) {
  const indices = Object.create(null) as Record<PackageId, number>
  for (const { id } of packages) {
    indices[id] = 0
  }

  for (let i = 0; i < packages.length; i++) {
    for (const { id, pkg } of packages) {
      if (!pkg.deps) continue
      for (const dep of pkg.deps) {
        indices[dep] = Math.min(indices[dep], indices[id] - 1)
      }
    }
  }

  const byIndex: Record<number, PackageId[]> = Object.create(null)
  for (const key in indices) {
    ;(byIndex[indices[key as PackageId]] ??= []).push(key as PackageId)
  }
  const entries = Object.entries(byIndex)
    .map(([k, v]) => [+k, v] as const)
    .sort(([a], [b]) => a - b)
    .flatMap((x) => x[1])
  return entries.map((id) => packages.find((x) => x.id == id)!)
}
