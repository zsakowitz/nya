import type { OpBinary, PuncInfix, PuncUnary } from "@/eval/ast/token"
import { builtin, index, type PackageId } from ".."
import type { Package } from "../types"
import { order } from "./order"
import {
  manifestFnKinds,
  type Manifest,
  type ManifestFn,
  type ManifestFnKindIndex,
  type ManifestFnKindName,
  type PackageIndex,
} from "./types"

/*! https://stackoverflow.com/a/47593316 */
function cyrb128(str: string) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  ;(h1 ^= h2 ^ h3 ^ h4), (h2 ^= h1), (h3 ^= h1), (h4 ^= h1)
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0] as const
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a |= 0
    b |= 0
    c |= 0
    d |= 0
    let t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}

function color(str: string) {
  const [a, b, c, d] = cyrb128(str)
  const gen = sfc32(a, b, c, d)
  for (let i = 0; i < 17; i++) gen()
  const absL = 8 / (8 + 1.0)
  const absM = 0.75 / (0.75 + 1.0)
  const absD = 0.25 / (0.25 + 1.0)
  const r0 = 0.08499547839164734 * 1.28
  const offset = 0.8936868 * 3.141592653589793
  const angle = 2 * Math.PI * gen() + offset
  const rdL = 1.5 * r0 * (1.0 - 2.0 * Math.abs(absL - 0.5))
  const rdM = 1.5 * r0 * (1.0 - 2.0 * Math.abs(absM - 0.5))
  const rdD = 1.5 * r0 * (1.0 - 2.0 * Math.abs(absD - 0.5))
  return [
    `oklab(${absL} ${rdL * Math.cos(angle)} ${rdL * Math.sin(angle)})`,
    `oklab(${absM} ${rdM * Math.cos(angle)} ${rdM * Math.sin(angle)})`,
    `oklab(${absD} ${rdD * Math.cos(angle)} ${rdD * Math.sin(angle)})`,
  ] as const
}

async function createManifest(): Promise<Manifest> {
  const pkgs = order(
    await Promise.all(
      Object.entries(index).map(async ([id, load]) => {
        const pkg: Package = (await load()).default
        return { id: id as PackageId, pkg }
      }),
    ),
  )
    .sort(({ id: a }, { id: b }) => +(b in builtin) - +(a in builtin))
    .map((x, i) => ({ ...x, index: i as PackageIndex }))

  const packages: Manifest["packages"] = pkgs.map((x) => [
    x.id,
    x.pkg.name,
    ...color(x.id),
    x.pkg.label,
    x.pkg.deps.map((id) => pkgs.findIndex((x) => x.id == id) as PackageIndex),
  ])

  const fns: Record<string, ManifestFn[]> = Object.create(null)
  for (const { index, pkg } of pkgs) {
    if (pkg.eval?.fn) {
      for (const key in pkg.eval.fn) {
        addRef(key, "fn/named", index, pkg.eval.fn[key]!)
      }
    }

    if (pkg.eval?.var) {
      for (const key in pkg.eval.var) {
        addRef(key, "var/named", index, {
          name: key,
          label: pkg.eval.var[key]!.label,
          word: pkg.eval.var[key]!.word,
        })
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
          pkg.eval.op.binary[key as PuncInfix]!.fn.name,
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
    props: { name: string; label: string; word?: boolean },
  ) {
    const kIndex = manifestFnKinds.indexOf(kind) as ManifestFnKindIndex
    const fs = (fns[key] ??= [])
    let x: ManifestFn
    ;(fs.find((x) => x[3] == kIndex) ??
      (fs.push(
        (x =
          props.word && (key.length == 1 || props.name.length == 1) ?
            [props.name, props.label, [], kIndex, true]
          : [props.name, props.label, [], kIndex]),
      ),
      x))[2].push(index)
  }
}

console.log(JSON.stringify(await createManifest()))
