import type {
  KAs,
  KConst,
  OArrowMap,
  OBang,
  OColon,
  ODot,
  TIdent,
  TLabel,
  TSym,
} from "../kind"
import type { Print } from "../print"
import type { TokenGroup } from "../stream"
import type { Token } from "../token"
import type { Expr } from "./expr"
import type { Item } from "./item"
import { Node, type Ident, type IdentFnName } from "./node"
import type { Pat } from "./pat"
import type { Type } from "./type"

export class GenericParam extends Node {
  constructor(
    readonly name: Ident,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type | null,
  ) {
    super(name.start, (type ?? colon ?? name).end)
  }
}

export class GenericParams extends Node {
  constructor(readonly list: List<GenericParam>) {
    super(list.start, list.end)
  }
}

export class PlainList<T extends Print> extends Node {
  constructor(
    readonly items: T[],
    start: number,
    end: number,
  ) {
    super(start, end)
  }
}

export class List<T extends Print, U extends Print | null = null> extends Node {
  constructor(
    readonly bracket: TokenGroup,
    readonly items: T[],
    readonly terminator: U,
  ) {
    super(bracket.start, bracket.end)
  }
}

export class StructArg extends Node {
  constructor(
    readonly name: Ident,
    readonly colon: Token<typeof OColon> | null,
    readonly expr: Expr | null,
  ) {
    super(name.start, (expr ?? colon ?? name).end)
  }
}

export class ExprLabel extends Node {
  constructor(
    readonly label: Token<typeof TLabel>,
    readonly colon: Token<typeof OColon> | null,
  ) {
    super(label.start, (colon ?? label).end)
  }
}

export class MatchArm extends Node {
  constructor(
    readonly pat: Pat,
    readonly arrow: Token<typeof OArrowMap> | null,
    readonly expr: Expr,
  ) {
    super(pat.start, expr.end)
  }
}

export class Prop extends Node {
  constructor(
    readonly dot: Token<typeof ODot>,
    readonly name: Token<typeof TIdent> | null,
  ) {
    super(dot.start, (name ?? dot).end)
  }
}

export class FnParam extends Node {
  constructor(
    readonly ident: Ident,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type,
  ) {
    super(ident.start, type.end)
  }
}

export class StructFieldDecl extends Node {
  constructor(
    readonly constKw: Token<typeof KConst> | null,
    readonly name: Ident | null,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type,
  ) {
    super((constKw ?? name ?? colon ?? type).start, type.end)
  }
}

export class EnumVariant extends Node {
  constructor(
    readonly name: Token<typeof TSym>,
    readonly fields: List<StructFieldDecl> | null,
  ) {
    super(name.start, (fields ?? name).end)
  }
}

export class EnumMapVariant extends Node {
  constructor(
    readonly name: Token<typeof TSym>,
    readonly arrow: Token<typeof OArrowMap> | null,
    readonly of: Expr,
  ) {
    super(name.start, of.end)
  }
}

export class ExposeAliases extends Node {
  constructor(
    readonly as: Token<typeof KAs>,
    readonly alias: IdentFnName | List<IdentFnName> | null,
  ) {
    super(as.start, (alias ?? as).end)
  }
}

export class Script extends Node {
  constructor(
    readonly items: Item[],
    start: number,
    end: number,
  ) {
    super(start, end)
  }
}

export class VarWithout extends Node {
  constructor(
    readonly bang: Token<typeof OBang>,
    readonly names: Ident | List<Ident> | null,
  ) {
    super(bang.start, (names ?? bang).end)
  }
}
