import type { KAssert, KElse, KLet, OColon, OEq, OSemi, TString } from "../kind"
import type { Token } from "../token"
import type { Expr } from "./expr"
import { Node, type Ident } from "./node"
import type { Type } from "./type"

export abstract class Stmt extends Node {
  declare private __brand_stmt
}

export class StmtExpr extends Stmt {
  constructor(
    readonly expr: Expr,
    readonly semi: Token<typeof OSemi> | null,
    /** `true` only if `expr` is a plain expr and has no semicolon. */
    readonly terminatesBlock: boolean,
  ) {
    super(expr.start, semi?.end ?? expr.end)
  }
}

export class StmtLet extends Stmt {
  constructor(
    readonly kw: Token<typeof KLet>,
    readonly ident: Ident | null,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type | null,
    readonly eq: Token<typeof OEq> | null,
    readonly value: Expr | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? value ?? eq ?? type ?? colon ?? ident ?? kw).end)
  }
}

export class StmtAssert extends Stmt {
  constructor(
    readonly kw: Token<typeof KAssert>,
    readonly expr: Expr,
    readonly elseKw: Token<typeof KElse> | null,
    readonly message: Token<typeof TString> | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? message ?? elseKw ?? expr).end)
  }
}
