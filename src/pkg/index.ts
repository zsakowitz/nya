import type {
  Node,
  NodeName,
  Nodes,
  PuncInfix,
  PuncUnary,
} from "../eval/ast/token"
import type { AstTxr, MagicVarTxr } from "../eval/ast/tx"
import type { Fn } from "../eval/ops"
import type { WithDocs } from "../eval/ops/docs"
import type { Builtin } from "../eval/ops/vars"
import type { TyComponents, TyName, Tys } from "../eval/ty"
import type { TyCoerceMap, TyInfo } from "../eval/ty/info"
import type { ParenLhs, ParenRhs } from "../field/cmd/math/brack"
import type { LatexInit } from "../field/latex"
import type { Init } from "../field/model"
import type { AnyExt } from "../sheet/ext"
import type { Sheet } from "../sheet/ui/sheet"

type List<T, K extends PropertyKey = string> = { readonly [_ in K]?: T }

export interface Package {
  id: string
  name: string
  label: string | null

  load?(): void
  init?(sheet: Sheet): void
  deps?: (() => Package)[]

  field?: {
    inits?: List<Init>
    //   shortcuts?: List<Init>
    //   autos?: List<Init>
    latex?: List<LatexInit>
    //   options?: Partial<Options>
  }

  ty?: {
    info?: Partial<{ [K in TyName]: TyInfo<Tys[K], TyComponents[K]> }>
    /** For adding coercions from already-defined types. */
    coerce?: Partial<{ [T in TyName]: TyCoerceMap<Tys[T]> }>
  }

  eval?: {
    txrs?: Partial<{ [K in NodeName]: AstTxr<Nodes[K]> }>
    vars?: List<Builtin>
    fns?: List<Fn & WithDocs>
    op?: {
      unary?: List<Fn & WithDocs, PuncUnary>
      binary?: List<{ precedence: number; fn: Fn & WithDocs }, PuncInfix>
      magic?: List<MagicVarTxr>
      group?: List<Omit<AstTxr<Node>, "deps">, `${ParenLhs} ${ParenRhs}`>
    }
  }

  sheet?: {
    exts?: Record<number, AnyExt[]>
    toolbar?: Record<number, ToolbarItem[]>
    keys?: Record<string, (sheet: Sheet) => void>
  }

  docs?: Record<string, () => HTMLElement[]>
}

export interface ToolbarItem {
  (sheet: Sheet): HTMLSpanElement
}
