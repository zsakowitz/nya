import {
  Precedence,
  PRECEDENCE_MAP,
  type NodeName,
  type OpBinary,
  type PuncInfix,
  type PuncUnary,
} from "../eval/ast/token"
import {
  TXR_AST,
  TXR_GROUP,
  TXR_MAGICVAR,
  TXR_OP_BINARY,
  TXR_OP_UNARY,
  type TxrAst,
} from "../eval/ast/tx"
import { FNS, OP_BINARY, OP_UNARY } from "../eval/ops"
import { VARS } from "../eval/ops/vars"
import type { TyName } from "../eval/ty"
import { TY_INFO, type TyCoerce } from "../eval/ty/info"
import type { ParenLhs, ParenRhs } from "../field/cmd/math/brack"
import { Inits, WordMap, type Options } from "../field/options"
import type { Package, ToolbarItem } from "../pkg"
import { Exts } from "./ext"
import { FACTORY_EXPR, type AnyItemFactory } from "./item"
import { Sheet } from "./ui/sheet"

export class SheetFactory {
  readonly exts: Record<number, Exts> = Object.create(null)
  readonly toolbar: Record<number, ToolbarItem[]> = Object.create(null)
  readonly keys: Record<string, (sheet: Sheet) => void> = Object.create(null)
  readonly items: Record<string, AnyItemFactory> = Object.create(null)
  defaultItem: AnyItemFactory = FACTORY_EXPR

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
        console.log(`[load] ${dep.id} from ${pkg.id}`)
      }
      this.load(dep)
    }
    pkg.load?.()

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

    for (const key in pkg.eval?.fn) {
      this.options.words.init(key, "prefix")
      FNS[key] = pkg.eval.fn[key]!
    }

    for (const key in pkg.eval?.var) {
      if (key.length > 1) {
        this.options.words.init(key, "var")
      }
      VARS[key] = pkg.eval.var[key]!
    }

    for (const keyRaw in pkg.eval?.tx?.ast) {
      const key = keyRaw as NodeName
      const txr = pkg.eval.tx.ast[key]! as TxrAst<any>
      if (TXR_AST[key] && (TXR_AST[key].layer ?? 0) >= (txr.layer ?? 0)) {
        continue
      }
      TXR_AST[key] = pkg.eval.tx.ast[key]! as any
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

    for (const keyRaw in pkg.eval?.op?.binary) {
      const key = keyRaw as PuncInfix
      if (/^[A-Za-z]+$/.test(key)) {
        this.options.words.init(key, "infix")
      }
      OP_BINARY[key] = pkg.eval.op.binary[key]!.fn
      PRECEDENCE_MAP[key] = pkg.eval.op.binary[key]!.precedence
    }

    for (const keyRaw in pkg.eval?.op?.unary) {
      const key = keyRaw as PuncUnary
      if (/^[A-Za-z]+$/.test(key)) {
        this.options.words.init(key, "prefix")
      }
      OP_UNARY[key] = pkg.eval.op.unary[key]!
    }

    for (const key in pkg.eval?.tx?.magic) {
      if (/^[A-Za-z]+$/.test(key)) {
        this.options.words.init(key, "magicprefix")
      }
      const txr = pkg.eval.tx.magic[key]!
      if (
        TXR_MAGICVAR[key] &&
        (TXR_MAGICVAR[key].layer ?? 0) >= (txr.layer ?? 0)
      ) {
        continue
      }
      for (const helper of txr.helpers || []) {
        this.options.words.init(helper, "infix")
        PRECEDENCE_MAP[helper] = Precedence.WordInfixList
        if (!(helper in OP_BINARY)) {
          OP_BINARY[helper] = {
            glsl() {
              throw new Error(
                `The operator '${helper}' can only be used as part of an '${key}' expression.`,
              )
            },
            js() {
              throw new Error(
                `The operator '${helper}' can only be used as part of an '${key}' expression.`,
              )
            },
          }
        }
      }

      TXR_MAGICVAR[key] = txr
    }

    for (const keyRaw in pkg.eval?.tx?.group) {
      const key = keyRaw as `${ParenLhs} ${ParenRhs}`
      const txr = pkg.eval.tx.group[key]!
      if (TXR_GROUP[key] && (TXR_GROUP[key].layer ?? 0) >= (txr.layer ?? 0)) {
        continue
      }
      TXR_GROUP[key] = txr
    }

    for (const keyRaw in pkg.eval?.tx?.unary) {
      const key = keyRaw as PuncUnary
      const txr = pkg.eval.tx.unary[key]!
      if (
        TXR_OP_UNARY[key] &&
        (TXR_OP_UNARY[key].layer ?? 0) >= (txr.layer ?? 0)
      ) {
        continue
      }
      if (/^[A-Za-z]+$/.test(key)) {
        this.options.words.init(key, "prefix")
      }
      TXR_OP_UNARY[key] = txr
    }

    for (const keyRaw in pkg.eval?.tx?.binary) {
      const key = keyRaw as OpBinary
      const txr = pkg.eval.tx.binary[key]!
      if (
        TXR_OP_BINARY[key] &&
        (TXR_OP_BINARY[key].layer ?? 0) >= (txr.layer ?? 0)
      ) {
        continue
      }
      if (!(key in PRECEDENCE_MAP)) {
        PRECEDENCE_MAP[key] = Precedence.WordInfix
      }
      if (/^[A-Za-z]+$/.test(key)) {
        this.options.words.init(key, "infix")
      }
      TXR_OP_BINARY[key] = txr
    }

    for (const item of pkg.sheet?.items ?? []) {
      if (
        !this.items[item.id] ||
        (this.items[item.id]?.layer ?? 0) < (item.layer ?? 0)
      ) {
        this.items[item.id] = item
      }
    }

    if (pkg.sheet?.defaultItem) {
      const item = pkg.sheet.defaultItem

      if (
        !this.defaultItem ||
        (this.defaultItem?.layer ?? 0) < (item.layer ?? 0)
      ) {
        this.defaultItem = item
      }
    }

    return this
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
      pkg.init?.(sheet)
    }
    return sheet
  }
}
