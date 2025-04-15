import type { OpBinary, PuncInfix, PuncUnary } from "@/eval/ast/token"
import { options } from "@/field/defaults"
import { SheetFactory } from "@/sheet/factory"
import { index, type PackageId } from ".."
import type { Package } from "../types"
import {
  manifestFnKinds,
  type Manifest,
  type ManifestFn,
  type ManifestFnKindIndex,
  type ManifestFnKindName,
  type PackageIndex,
} from "./types"

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

    if (pkg.eval?.tx?.unary) {
      for (const key in pkg.eval.tx.unary) {
        addRef(key, "op/unary", index, {
          name: key,
          label: pkg.eval.tx.unary[key as PuncUnary]!.label,
        })
      }
    }

    if (pkg.eval?.tx?.binary) {
      for (const key in pkg.eval.tx.binary) {
        addRef(key, "op/binary", index, {
          name: key,
          label: pkg.eval.tx.binary[key as OpBinary]!.label,
        })
      }
    }

    if (pkg.eval?.tx?.magic) {
      for (const key in pkg.eval.tx.magic) {
        const item = pkg.eval.tx.magic[key]!
        addRef(
          key,
          item.takesWord ? "magic/prefix"
          : item.fnlike ? "magic/fn"
          : "magic/kw",
          index,
          { name: key, label: item.label },
        )
      }
    }

    if (pkg.eval?.tx?.wordPrefix) {
      for (const key in pkg.eval.tx.wordPrefix) {
        const item = pkg.eval.tx.wordPrefix[key]!
        addRef(key, "magic/prefix", index, { name: key, label: item.label })
      }
    }
  }

  return {
    packages,
    fns,
  }

  function addRef(
    key: string,
    kind: ManifestFnKindName,
    index: PackageIndex,
    props: { name: string; label: string },
  ) {
    const kIndex = manifestFnKinds.indexOf(kind) as ManifestFnKindIndex
    const fs = (fns[key] ??= [])
    let x: ManifestFn
    ;(fs.find((x) => x[3] == kIndex) ??
      (fs.push((x = [props.name, props.label, [], kIndex])), x))[2].push(index)
  }
}

console.log(JSON.stringify(await createManifest()))
