import {
  type Brack,
  type KAs,
  type KConst,
  type KElse,
  type KUsage,
  type OArrowMap,
  type OArrowRet,
  type OBangUnary,
  type OColon,
  type OColonColon,
  type ODot,
  type OEq,
  type OSemi,
  type TIdent,
  type TLabel,
  type TString,
  type TSym,
} from "../kind"
import type { TokenGroup } from "../stream"
import type { Token } from "../token"
import type { Expr, ExprBlock, ExprIf } from "./expr"
import type { Item } from "./item"
import { Node, type Ident, type IdentFnName } from "./node"
import type { Pat } from "./pat"
import type { Type } from "./type"

export class ParamType extends Node {
  constructor(
    readonly colon: Token<typeof OColon>,
    readonly type: Type | null,
  ) {
    super(colon.start, (type ?? colon).end)
  }
}

export class GenericParam extends Node {
  constructor(
    readonly name: Ident,
    readonly type: ParamType | null,
  ) {
    super(name.start, (type ?? name).end)
  }
}

export class GenericParams extends Node {
  constructor(readonly list: List<GenericParam>) {
    super(list.start, list.end)
  }
}

export class PlainList<T extends Expr | Ident> extends Node {
  constructor(
    readonly items: T[],
    start: number,
    end: number,
  ) {
    super(start, end)
  }
}

export class List<T, U = null> extends Node {
  constructor(
    readonly bracket: TokenGroup,
    readonly items: T[],
    readonly terminator: U,
    readonly commas: boolean,
    /**
     * Whether to force each item onto a separate line when pretty-printing. May
     * be mutated during printing.
     */
    public block: boolean,
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
    readonly bang: Token<typeof OBangUnary>,
    readonly names: Ident | List<Ident> | null,
  ) {
    super(bang.start, (names ?? bang).end)
  }
}

export class PrescribedType extends Node {
  constructor(
    readonly dcolon: Token<typeof OColonColon>,
    readonly type: Type | null,
    /** Whether to print with spaces after the `::`. */
    readonly spaced: boolean,
  ) {
    super(dcolon.start, (type ?? dcolon).end)
  }
}

export class Rule extends Node {
  constructor(
    readonly lhs: Expr,
    readonly arrow: Token<typeof OArrowMap> | null,
    readonly rhs: Expr,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(lhs.start, (semi ?? rhs).end)
  }
}

export class FnReturnType extends Node {
  constructor(
    readonly arrow: Token<typeof OArrowRet>,
    readonly retType: Type | null,
  ) {
    super(arrow.start, (retType ?? arrow).end)
  }
}

export class FnUsage extends Node {
  constructor(
    readonly kw: Token<typeof KUsage>,
    readonly usages: PlainList<Expr> | null,
  ) {
    super(kw.start, (usages ?? kw).end)
  }
}

export class Else extends Node {
  constructor(
    readonly kw: Token<typeof KElse>,
    readonly block: ExprBlock | ExprIf | null,
  ) {
    super(kw.start, (block ?? kw).end)
  }
}

export class Bracketed<
  K extends Brack,
  T extends { end: number },
> extends Node {
  constructor(
    readonly brack: TokenGroup<K>,
    readonly value: T,
  ) {
    super(brack.start, value.end)
  }
}

export class StructPatProp extends Node {
  constructor(
    readonly key: Ident,
    readonly pat: StructPatPropPat | null,
  ) {
    super(key.start, (pat ?? key).end)
  }
}

export class StructPatPropPat extends Node {
  constructor(
    readonly colon: Token<typeof OColon>,
    readonly pat: Pat,
  ) {
    super(colon.start, pat.end)
  }
}

export class Initializer extends Node {
  constructor(
    readonly eq: Token<typeof OEq>,
    readonly value: Expr,
  ) {
    super(eq.start, (value ?? eq).end)
  }
}

export class AssertionMessage extends Node {
  constructor(
    readonly kw: Token<typeof KElse>,
    readonly message: Token<typeof TString> | null,
  ) {
    super(kw.start, (message ?? kw).end)
  }
}
