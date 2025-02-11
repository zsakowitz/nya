import { FNS } from "../eval/ops"
import { VARS } from "../eval/ops/vars"
import type { TyName } from "../eval/ty"
import { TY_INFO, type TyCoerce } from "../eval/ty/info"
import { WordMap, type Options } from "../field/options"
import type { Package } from "../pkg"
import type { Exts } from "./ext"
import { Sheet } from "./ui/sheet"

export class SheetFactory {
  constructor(
    readonly options: Options,
    readonly exts: Exts,
  ) {
    this.options = { ...this.options, words: this.options.words?.clone() }
  }

  private loaded: string[] = []
  private queuedCoercions: Record<string, Record<string, TyCoerce<any, any>>> =
    Object.create(null)
  load(pkg: Package) {
    if (this.loaded.includes(pkg.id)) {
      return this
    }
    this.loaded.push(pkg.id)

    for (const k in pkg.ty?.info) {
      const key = k as TyName
      TY_INFO[key] = pkg.ty.info[key]! as any
      if (key in this.queuedCoercions) {
        Object.assign(TY_INFO[key].coerce, this.queuedCoercions[key])
        delete this.queuedCoercions[key]
      }
    }

    for (const ___a in pkg.ty?.coerce) {
      const src = ___a as TyName
      const map = pkg.ty.coerce[src]!

      for (const ___b in map) {
        const dst = ___b as TyName
        if (src in TY_INFO) {
          ;(TY_INFO[src].coerce[dst] as any) = map[dst]!
        } else {
          ;(this.queuedCoercions[src] ??= Object.create(null))[dst] = map[dst]!
        }
      }
    }

    for (const key in pkg.eval?.fns) {
      ;(this.options.words ??= new WordMap([]))?.set(key, "prefix")
      FNS[key] = pkg.eval.fns[key]!
    }

    for (const key in pkg.eval?.vars) {
      VARS[key] = pkg.eval.vars[key]!
    }

    return this
  }

  create() {
    return new Sheet(this.options, this.exts)
  }
}
