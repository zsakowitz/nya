import type { KAssert, KLet, OSemi } from "../kind"
import type { Token } from "../token"
import type { Expr } from "./expr"
import type {
  AssertionMessage,
  Comments,
  Initializer,
  ParamType,
} from "./extra"
import { Node, type Ident } from "./node"

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
    readonly type: ParamType | null,
    readonly value: Initializer | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? value ?? type ?? ident ?? kw).end)
  }
}

export class StmtAssert extends Stmt {
  constructor(
    readonly kw: Token<typeof KAssert>,
    readonly expr: Expr,
    readonly message: AssertionMessage | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? message ?? expr).end)
  }
}

export class StmtComment extends Stmt {
  constructor(readonly of: Comments) {
    super(of.start, of.end)
  }
}
