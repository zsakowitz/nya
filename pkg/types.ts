import type {
  NodeName,
  Nodes,
  OpBinary,
  PuncInfix,
  PuncUnary,
  Suffixes,
  SuffixName,
} from "@/eval/ast/token"
import type {
  TxrAst,
  TxrGroup,
  TxrMagicVar,
  TxrOpBinary,
  TxrOpUnary,
  TxrSuffix,
  TxrWordPrefix,
} from "@/eval/ast/tx"
import type { Fn } from "@/eval/ops"
import type { WithDocs } from "@/eval/ops/docs"
import type { Builtin } from "@/eval/ops/vars"
import type { SymName, Syms, TxrSym } from "@/eval/sym"
import type { TyName, Tys } from "@/eval/ty"
import type { TyCoerceMap, TyInfo } from "@/eval/ty/info"
import type { ParenLhs, ParenRhs } from "@/field/cmd/math/brack"
import type { LatexInit } from "@/field/latex"
import type { Init } from "@/field/model"
import type { AnyExt } from "@/sheet/ext"
import type { AnyItemFactory } from "@/sheet/item"
import type { Sheet } from "@/sheet/ui/sheet"
import type { PackageId } from "."

type List<T, K extends PropertyKey = string> = { readonly [_ in K]?: T }

export type PackageCategory =
  | "chemistry"
  | "color"
  | "core"
  | "geometry"
  | "images"
  | "lists"
  | "logic"
  | "measurement"
  | "miscellaneous"
  | "number theory"
  | "numbers (multi-dimensional)"
  | "numbers"
  | "sheet items"
  | "statistics"
  | "substitution"
  | "symbolic computation"
  | "trigonometry"

// SHAPE: maybe use consistent shapes
export interface Package {
  name: string
  label: string | null
  category: PackageCategory

  load?(): void
  init?(sheet: Sheet): void
  deps?: PackageId[]

  field?: {
    inits?: List<Init>
    //   shortcuts?: List<Init>
    //   autos?: List<Init>
    latex?: List<LatexInit>
    //   options?: Partial<Options>
  }

  ty?: {
    info?: Partial<{ [K in TyName]: TyInfo<Tys[K]> }>
    /** For adding coercions from already-defined types. */
    coerce?: Partial<{ [T in TyName]: TyCoerceMap<Tys[T]> }>
  }

  eval?: {
    var?: List<Builtin>
    fn?: List<Fn & WithDocs>
    op?: {
      unary?: List<Fn & WithDocs, PuncUnary>
      binary?: List<{ precedence: number; fn: Fn & WithDocs }, PuncInfix>
    }
    tx?: {
      unary?: List<TxrOpUnary, PuncUnary>
      binary?: List<TxrOpBinary & { precedence: number }, OpBinary>
      magic?: List<TxrMagicVar>
      group?: List<TxrGroup, `${ParenLhs} ${ParenRhs}`>
      ast?: { [K in NodeName]?: TxrAst<Nodes[K]> }
      suffix?: { [K in SuffixName]?: TxrSuffix<Suffixes[K]> }
      wordPrefix?: List<TxrWordPrefix>
    }
    // `sym` is separated from other `tx` since it works separately
    sym?: { [K in SymName]?: TxrSym<Syms[K] & { type: K }> }
  }

  sheet?: {
    defaultItem?: AnyItemFactory
    items?: AnyItemFactory[]
    exts?: Record<number, AnyExt[]>
    toolbar?: Record<number, ToolbarItem[]>
    keys?: List<(sheet: Sheet) => void>
  }

  docs?: readonly Doc[]
}

export interface Doc {
  name: string
  poster: string
  render(): HTMLElement[]
}

export interface ToolbarItem {
  (sheet: Sheet): HTMLSpanElement
}
