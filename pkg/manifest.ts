import type { PuncInfix, PuncUnary } from "@/eval/ast/token"
import { options } from "@/field/defaults"
import { SheetFactory } from "@/sheet/factory"
import { index, type PackageId } from "."
import type { Package } from "./types"

type PackageIndex = number & { readonly __package_index: unique symbol }

export type ManifestFnKind =
  | "fn/named"
  | "fn/op/unary"
  | "fn/op/binary"
  | "op/unary"
  | "op/binary"
  | "magic/kw"
  | "magic/fn"

export interface ManifestFn {
  name: string
  label: string
  refs: PackageIndex[]
  kind: ManifestFnKind
}

export interface Manifest {
  packages: PackageId[]

  /** Key => array of possible results */
  fns: Record<string, ManifestFn[]>
}

async function createManifest(): Promise<Manifest> {
  const factory = new SheetFactory(options)
  const pkgs = await Promise.all(
    Object.entries(index).map(async ([id, load], index) => {
      const pkg: Package = (await load()).default
      return { id: id as PackageId, pkg, index: index as PackageIndex }
    }),
  )
  await Promise.all(pkgs.map((x) => factory.load(x.pkg)))

  const packages: Manifest["packages"] = pkgs.map((x) => x.id)

  const fns: Record<string, ManifestFn[]> = Object.create(null)
  for (const { index, pkg } of pkgs) {
    if (pkg.eval?.fn) {
      for (const key in pkg.eval.fn) {
        addRef(key, "fn/named", index, pkg.eval.fn[key]!)
      }
    }

    if (pkg.eval?.op?.unary) {
      for (const key in pkg.eval.op.unary) {
        addRef(key, "fn/op/unary", index, pkg.eval.op.unary[key as PuncUnary]!)
      }
    }

    if (pkg.eval?.op?.binary) {
      for (const key in pkg.eval.op.binary) {
        addRef(
          key,
          "fn/op/binary",
          index,
          pkg.eval.op.binary[key as PuncInfix]!.fn,
        )
      }
    }
  }

  return {
    packages,
    fns,
  }

  function addRef(
    key: string,
    kind: ManifestFnKind,
    index: PackageIndex,
    props: { name: string; label: string },
  ) {
    const fs = (fns[key] ??= [])
    let x: ManifestFn
    ;(
      fs.find((x) => x.kind == kind) ??
      (fs.push(
        (x = {
          name: props.name,
          label: props.label,
          kind,
          refs: [],
        }),
      ),
      x)
    ).refs.push(index)
  }
}

console.log(JSON.stringify(await createManifest(), undefined, 2))
