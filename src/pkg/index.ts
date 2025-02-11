import type { NodeName, Nodes } from "../eval/ast/token"
import type { AstTxr } from "../eval/ast/tx"
import type { Fn } from "../eval/ops"
import type { Builtin } from "../eval/ops/vars"
import type { TyComponents, TyName, Tys } from "../eval/ty"
import type { TyCoerceMap, TyInfo } from "../eval/ty/info"
import type { LatexInit } from "../field/latex"
import type { Init } from "../field/model"
import type { AnyExt } from "../sheet/ext"
import type { Sheet } from "../sheet/ui/sheet"

export type List<T> = { readonly [x: string]: T }

export interface Package {
  id: string
  name: string
  label: string

  field?: {
    inits?: List<Init>
    //   shortcuts?: List<Init>
    //   autos?: List<Init>
    //   /** All names in `eval.fns` are automatically included as prefix words. */
    //   words?: List<WordKind>
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
    fns?: List<Fn>
    vars?: List<Builtin>
    // opUnary?: List<Fn>
    // opBinary?: List<Fn>
  }

  sheet?: {
    exts?: Record<number, AnyExt[]>
    // toolbar?: List<ToolbarItem>
  }

  // remarks?: readonly string[]
}

export interface ToolbarItem {
  icon(): HTMLSpanElement
  onClick(sheet: Sheet): void
}
