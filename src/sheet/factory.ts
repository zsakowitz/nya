import type { NodeName } from "../eval/ast/token"
import { AST_TXRS } from "../eval/ast/tx"
import { FNS } from "../eval/ops"
import { VARS } from "../eval/ops/vars"
import type { TyName } from "../eval/ty"
import { TY_INFO, type TyCoerce } from "../eval/ty/info"
import { Inits, WordMap, type Options } from "../field/options"
import type { Package, ToolbarItem } from "../pkg"
import { Exts } from "./ext"
import { Sheet } from "./ui/sheet"

export class SheetFactory {
  readonly exts: Record<number, Exts> = Object.create(null)
  readonly toolbar: Record<number, ToolbarItem[]> = Object.create(null)
  readonly keys: Record<string, (sheet: Sheet) => void> = Object.create(null)

  options
  constructor(options: Options) {
    this.options = {
      ...options,
      inits: options.inits?.clone() ?? new Inits(),
      words: options.words?.clone() ?? new WordMap([]),
      latex: options.latex?.clone() ?? new WordMap([]),
    }
  }

  readonly loaded: Record<string, Package> = Object.create(null)
  private queuedCoercions: Record<string, Record<string, TyCoerce<any, any>>> =
    Object.create(null)
  load(pkg: Package) {
    if (pkg.id in this.loaded) {
      return this
    }
    this.loaded[pkg.id] = pkg

    for (const getDep of pkg.deps || []) {
      const dep = getDep()
      if (!(dep.id in this.loaded)) {
        console.log("loading " + dep.id + " from " + pkg.id)
      }
      this.load(dep)
    }
    pkg.init?.()

    for (const k in pkg.ty?.info) {
      const key = k as TyName
      TY_INFO[key] = pkg.ty.info[key]! as any
      if (key in this.queuedCoercions) {
        Object.assign(TY_INFO[key].coerce, this.queuedCoercions[key])
        delete this.queuedCoercions[key]
      }
    }

    for (const a in pkg.ty?.coerce) {
      const src = a as TyName
      const map = pkg.ty.coerce[src]!

      for (const b in map) {
        const dst = b as TyName
        if (src in TY_INFO) {
          ;(TY_INFO[src].coerce[dst] as any) = map[dst]!
        } else {
          ;(this.queuedCoercions[src] ??= Object.create(null))[dst] = map[dst]!
        }
      }
    }

    for (const key in pkg.eval?.fns) {
      if (this.options.words.has(key)) {
        console.log(key)
      }
      this.options.words?.set(key, "prefix")
      FNS[key] = pkg.eval.fns[key]!
    }

    for (const key in pkg.eval?.vars) {
      VARS[key] = pkg.eval.vars[key]!
    }

    for (const txr in pkg.eval?.txrs) {
      AST_TXRS[txr as NodeName] = pkg.eval.txrs[txr as NodeName]! as any
    }

    for (const prec in pkg.sheet?.exts) {
      const exts = (this.exts[prec as any] ??= new Exts())
      for (const ext of pkg.sheet.exts[prec as any]!) {
        exts.add(ext)
      }
    }

    for (const prec in pkg.sheet?.toolbar) {
      const toolbar = (this.toolbar[prec as any] ??= [])
      for (const ext of pkg.sheet.toolbar[prec as any]!) {
        toolbar.push(ext)
      }
    }

    for (const key in pkg.sheet?.keys) {
      this.keys[key] = pkg.sheet.keys[key]!
    }

    for (const key in pkg.field?.inits) {
      this.options.inits.set(key, pkg.field.inits[key]!)
    }

    for (const key in pkg.field?.latex) {
      this.options.latex.set(key, pkg.field.latex[key]!)
    }

    return this
  }

  create() {
    return new Sheet(
      this.options,
      new Exts(
        Object.entries(this.exts)
          .sort((a, b) => +a[0] - +b[0])
          .flatMap((x) => x[1].exts),
      ),
      Object.entries(this.toolbar)
        .sort((a, b) => +a[0] - +b[0])
        .flatMap((x) => x[1]),
      this.keys,
      this,
    )
  }

  docs() {}
}
