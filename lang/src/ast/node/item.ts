import type { EmitDecl } from "../../emit/block"
import type { ScopeFile } from "../../emit/scope"
import { VBool } from "../../emit/type"
import { Code } from "../issue"
import type {
  KAssert,
  KData,
  KElse,
  KEnum,
  KExpose,
  KFn,
  KRule,
  KStruct,
  KType,
  KUsage,
  KUse,
  OArrowMap,
  OArrowRet,
  OColon,
  ODotDot,
  OLBrace,
  OSemi,
  TString,
} from "../kind"
import type { TokenGroup } from "../stream"
import type { Token } from "../token"
import type { Expr, ExprBlock, Source } from "./expr"
import type {
  EnumMapVariant,
  EnumVariant,
  ExposeAliases,
  FnParam,
  GenericParams,
  List,
  PlainList,
  StructFieldDecl,
} from "./extra"
import { Node, type Ident, type IdentFnName } from "./node"
import type { Type } from "./type"

export abstract class Item extends Node {
  declare private __brand_item

  emit(root: ScopeFile, decl: EmitDecl) {
    root
    decl
    throw new Error(`Cannot emit '${this.constructor.name}' yet.`)
  }
}

export class ItemType extends Item {
  constructor(
    readonly kw: Token<typeof KType>,
    readonly ident: Ident | null,
    readonly braces: TokenGroup<typeof OLBrace> | null,
    readonly source: Source | null,
  ) {
    super(kw.start, (braces ?? ident ?? kw).end)
  }
}

export class ItemFn extends Item {
  constructor(
    readonly kw: Token<typeof KFn>,
    readonly name: IdentFnName | null,
    readonly tparams: GenericParams | null,
    readonly params: List<FnParam> | null,
    readonly arrow: Token<typeof OArrowRet> | null,
    readonly retType: Type | null,
    readonly usageKw: Token<typeof KUsage> | null,
    readonly usages: PlainList<Expr> | null,
    readonly block: ExprBlock | null,
  ) {
    super(
      kw.start,
      (
        block ??
        usages ??
        usageKw ??
        retType ??
        arrow ??
        params ??
        tparams ??
        name ??
        kw
      ).end,
    )
  }
}

export class ItemRule extends Item {
  constructor(
    readonly kw: Token<typeof KRule>,
    readonly tparams: GenericParams | null,
    readonly lhs: Expr,
    readonly arrow: Token<typeof OArrowMap> | null,
    readonly rhs: Expr,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, rhs.end)
  }
}

export class ItemUse extends Item {
  constructor(
    readonly kw: Token<typeof KUse>,
    readonly source: Token<typeof TString> | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? source ?? kw).end)
  }
}

export class ItemEnum extends Item {
  constructor(
    readonly kw: Token<typeof KEnum>,
    readonly name: Ident | null,
    readonly tparams: GenericParams | null,
    readonly variants: List<EnumVariant, Token<typeof ODotDot> | null> | null,
  ) {
    super(kw.start, (variants ?? tparams ?? name ?? kw).end)
  }
}

export class ItemEnumMap extends Item {
  constructor(
    readonly kw: Token<typeof KEnum>,
    readonly name: Ident | null,
    readonly tparams: GenericParams | null,
    readonly arrow: Token<typeof OArrowRet>,
    readonly ret: Type,
    readonly variants: List<
      EnumMapVariant,
      Token<typeof ODotDot> | null
    > | null,
  ) {
    super(kw.start, (variants ?? ret).end)
  }
}

export class ItemStruct extends Item {
  constructor(
    readonly kw: Token<typeof KStruct>,
    readonly name: Ident | null,
    readonly tparams: GenericParams | null,
    readonly fields: List<StructFieldDecl, Token<typeof ODotDot> | null> | null,
  ) {
    super(kw.start, (fields ?? name ?? kw).end)
  }
}

export class ItemData extends Item {
  constructor(
    readonly data: Token<typeof KData>,
    readonly name: Ident | null,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(data.start, (semi ?? type).end)
  }
}

export class ItemTest extends Item {
  constructor(
    readonly kw: Token<typeof KAssert>,
    readonly expr: Expr,
    readonly kwElse: Token<typeof KElse> | null,
    readonly message: Token<typeof TString> | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? expr).end)
  }

  emit(root: ScopeFile, decl: EmitDecl): void {
    const emit = decl.block()
    const scope = root.block()
    const result = this.expr.emit(scope, emit, VBool)
    if (result.type.is(VBool)) {
      decl.source += `if (!(${result})) {
  console.error("test failed: " + ${JSON.stringify(root.source.slice(this.start, this.end))})
}
`
    } else {
      decl.issues.raise(Code.AssertionsMustResultInBool, this)
    }
  }
}

export class ItemExposeFn extends Item {
  constructor(
    readonly kw1: Token<typeof KExpose>,
    readonly kw2: Token<typeof KFn>,
    readonly name: IdentFnName | null,
    readonly label: Token<typeof TString> | null,
    readonly as: ExposeAliases | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw1.start, (semi ?? as ?? label ?? name ?? kw2).end)
  }
}

export class ItemExposeType extends Item {
  constructor(
    readonly kw1: Token<typeof KExpose>,
    readonly kw2: Token<typeof KType>,
    readonly name: IdentFnName | null,
    readonly targs: List<Type> | null,
    readonly label: Token<typeof TString> | null,
    readonly as: ExposeAliases | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw1.start, (semi ?? as ?? label ?? targs ?? name ?? kw2).end)
  }
}
