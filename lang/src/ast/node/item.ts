import type {
  KAssert,
  KData,
  KEnum,
  KExpose,
  KFn,
  KLocal,
  KMatrix,
  KRule,
  KStruct,
  KType,
  KUse,
  OArrowRet,
  OColon,
  ODotDot,
  OEq,
  OLBrace,
  OSemi,
  TString,
} from "../kind"
import type { TokenGroup } from "../stream"
import type { Token } from "../token"
import type { NodeExpose } from "./expose"
import type { ExprBlock, NodeExpr, Source } from "./expr"
import type {
  AssertionMessage,
  Comments,
  EnumMapVariant,
  EnumVariant,
  FnParam,
  FnReturnType,
  FnUsage,
  GenericParams,
  List,
  PlainList,
  Rule,
  StructFieldDecl,
} from "./extra"
import { Node, type Ident, type IdentFnName } from "./node"
import type { NodeType } from "./type"

export abstract class NodeItem extends Node {
  declare private __brand_item
}

export class ItemType extends NodeItem {
  constructor(
    readonly kw: Token<typeof KType>,
    readonly ident: Ident | null,
    readonly braces: TokenGroup<typeof OLBrace> | null,
    readonly source: Source | null,
  ) {
    super(kw.start, (braces ?? ident ?? kw).end)
  }
}

export class ItemTypeAlias extends NodeItem {
  constructor(
    readonly kw: Token<typeof KType>,
    readonly ident: Ident | null,
    readonly eq: Token<typeof OEq> | null,
    readonly of: NodeType | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? of ?? eq ?? ident ?? kw).end)
  }
}

export class ItemFn extends NodeItem {
  constructor(
    readonly kw: Token<typeof KFn>,
    readonly name: IdentFnName | null,
    readonly tparams: GenericParams | null,
    readonly params: List<FnParam> | null,
    readonly ret: FnReturnType | null,
    readonly usage: FnUsage | null,
    readonly block: ExprBlock | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(
      kw.start,
      (semi ?? block ?? usage ?? ret ?? params ?? tparams ?? name ?? kw).end,
    )
  }
}

export class ItemRule extends NodeItem {
  constructor(
    readonly kw: Token<typeof KRule>,
    readonly tparams: GenericParams | null,
    readonly value: Rule | List<Rule> | null,
  ) {
    super(kw.start, (value ?? tparams ?? kw).end)
  }
}

export class ItemUse extends NodeItem {
  constructor(
    readonly kw: Token<typeof KUse>,
    readonly source: Token<typeof TString> | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? source ?? kw).end)
  }
}

export class ItemEnum extends NodeItem {
  constructor(
    readonly kw: Token<typeof KEnum>,
    readonly name: Ident | null,
    readonly tparams: GenericParams | null,
    readonly variants: List<EnumVariant, Token<typeof ODotDot> | null> | null,
  ) {
    super(kw.start, (variants ?? tparams ?? name ?? kw).end)
  }
}

export class ItemEnumMap extends NodeItem {
  constructor(
    readonly kw: Token<typeof KEnum>,
    readonly name: Ident | null,
    readonly tparams: GenericParams | null,
    readonly arrow: Token<typeof OArrowRet>,
    readonly ret: NodeType,
    readonly variants: List<
      EnumMapVariant,
      Token<typeof ODotDot> | null
    > | null,
  ) {
    super(kw.start, (variants ?? ret).end)
  }
}

export class ItemStruct extends NodeItem {
  constructor(
    readonly kw: Token<typeof KStruct | typeof KMatrix>,
    readonly name: PlainList<Ident>,
    readonly tparams: GenericParams | null,
    readonly fields: List<StructFieldDecl, Token<typeof ODotDot> | null> | null,
  ) {
    super(kw.start, (fields ?? tparams ?? name).end)
  }
}

export class ItemData extends NodeItem {
  constructor(
    readonly data: Token<typeof KData>,
    readonly local: Token<typeof KLocal> | null,
    readonly name: Ident | null,
    readonly colon: Token<typeof OColon> | null,
    readonly type: NodeType,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(data.start, (semi ?? type).end)
  }
}

export class ItemAssert extends NodeItem {
  constructor(
    readonly kw: Token<typeof KAssert>,
    readonly expr: NodeExpr,
    readonly message: AssertionMessage | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? message ?? expr).end)
  }
}

export class ItemExpose extends NodeItem {
  constructor(
    readonly kw: Token<typeof KExpose>,
    readonly item: NodeExpose | List<NodeExpose> | null,
  ) {
    super(kw.start, (item ?? kw).end)
  }
}

export class ItemComment extends NodeItem {
  constructor(readonly of: Comments) {
    super(of.start, of.end)
  }
}
