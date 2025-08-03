import { NyaApi } from "!/emit/api"
import { EntrySet } from "!/exec/item"
import { ScriptEnvironment } from "!/exec/loader"
import { index, type PackageId } from "@/pkg"
import type { Package, ToolbarItem } from "@/pkg/types"
import {
  Inits,
  WordMap,
  WordMapWithoutSpaces,
  type Options,
} from "@/field/options"
import { Exts } from "./ext"
import { FACTORY_EXPR } from "./factory-expr"
import type { AnyItemFactory } from "./item"
import { Sheet } from "./ui/sheet"

export class SheetFactory {
  readonly exts: Record<number, Exts> = Object.create(null)
  readonly toolbar: Record<number, ToolbarItem[]> = Object.create(null)
  readonly keys: Record<string, (sheet: Sheet) => void> = Object.create(null)
  readonly items: Record<string, AnyItemFactory> = Object.create(null)
  readonly env = new ScriptEnvironment()
  readonly set = new EntrySet()
  defaultItem: AnyItemFactory = FACTORY_EXPR

  options
  constructor(options: Options) {
    this.options = {
      ...options,
      inits: options.inits?.clone() ?? new Inits(),
      words: options.words?.clone() ?? new WordMapWithoutSpaces([]),
      latex: options.latex?.clone() ?? new WordMap([]),
    }
  }

  readonly loaded: Partial<Record<PackageId, Package>> = Object.create(null)
  async load(id: PackageId) {
    if (id in this.loaded) return
    const pkg = (await index[id]()).default
    if (id in this.loaded) return // someone else might've loaded it
    this.loaded[id] = pkg

    if (pkg.deps) {
      for (const dep of pkg.deps) {
        await this.load(dep)
      }
    }
    pkg.load?.()
    if (pkg.api) {
      pkg.api(new NyaApi(this.env.libGl))
      pkg.api(new NyaApi(this.env.libJs))
      this.env.utils.markStale()
    }

    if (pkg.scripts) {
      for (const script of pkg.scripts) {
        this.env.load(script)
      }
    }

    const FN_NAME = /^[A-Za-z]{2,}(?:_[A-Za-z]{2,})*$/
    this.env.libJs.fns
      .map((x) => [x[0]?.id.label, x.some((x) => x.args.length > 0)] as const)
      .filter((x) => x[0] != null && FN_NAME.test(x[0]))
      .forEach(
        // TODO: make this robust against adding future overloads; maybe functions shouldn't all implicitly require an argument? or make them both prefix and var, but prefer the prefix interpretation
        (x) =>
          this.options.words.set(
            x[0]!.replace(/_/g, " "),
            x[1] ? "prefix" : "var",
          ),
      )
  }

  create() {
    const sheet = new Sheet(
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
    for (const pkg of Object.values(this.loaded)) {
      pkg.init?.fn(sheet)
    }
    return sheet
  }

  itemFactories() {
    const items = Object.values(this.items)
    if (!(this.defaultItem.id in items)) {
      items.unshift(this.defaultItem)
    }
    return items
  }
}
