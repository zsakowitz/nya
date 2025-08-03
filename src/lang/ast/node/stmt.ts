import type { KAssert, KLet, KMut, KType, OEq, OSemi, TString } from "../kind"
import type { Token } from "../token"
import type { NodeExpr } from "./expr"
import type {
  AssertionMessage,
  BuiltinTypePackSize,
  Comments,
  Initializer,
  ParamType,
} from "./extra"
import { Node, type Ident } from "./node"

export abstract class NodeStmt extends Node {
  declare private __brand_stmt
}

export class StmtExpr extends NodeStmt {
  constructor(
    readonly expr: NodeExpr,
    readonly semi: Token<typeof OSemi> | null,
    /** `true` only if `expr` is a plain expr and has no semicolon. */
    readonly terminatesBlock: boolean,
  ) {
    super(expr.start, semi?.end ?? expr.end, expr.info)
  }
}

export class StmtLet extends NodeStmt {
  constructor(
    readonly kw: Token<typeof KLet>,
    readonly mut: Token<typeof KMut> | null,
    readonly ident: Ident | null,
    readonly type: ParamType | null,
    readonly value: Initializer | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? value ?? type ?? ident ?? mut ?? kw).end, kw.info)
  }
}

export class StmtAssert extends NodeStmt {
  constructor(
    readonly kw: Token<typeof KAssert>,
    readonly expr: NodeExpr,
    readonly message: AssertionMessage | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? message ?? expr).end, kw.info)
  }
}

export class StmtComment extends NodeStmt {
  constructor(readonly of: Comments) {
    super(of.start, of.end, of.info)
  }
}

export class StmtBuiltinType extends NodeStmt {
  constructor(
    readonly kw: Token<typeof KType>,
    readonly ident: Ident | null,
    readonly pack: BuiltinTypePackSize | null,
    readonly eq: Token<typeof OEq>,
    readonly classifier: Ident | null,
    readonly source: Token<typeof TString> | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? ident ?? kw).end, kw.info)
  }
}
