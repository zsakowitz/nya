import type {
  KFalse,
  KTrue,
  OLBrack,
  OLParen,
  OSemi,
  TFloat,
  TIdent,
  TInt,
  TSym,
} from "../kind"
import type { TokenGroup } from "../stream"
import type { Token } from "../token"
import type { Expr, ExprBlock } from "./expr"
import type { List, PlainList } from "./extra"
import { Node } from "./node"

export abstract class Type extends Node {
  declare private __brand_type
}

export class TypeVar extends Type {
  constructor(
    readonly name: Token<typeof TIdent>,
    readonly targs: List<Type> | null,
  ) {
    super(name.start, (targs ?? name).end)
  }
}

export class TypeLit extends Type {
  constructor(
    readonly token: Token<
      typeof TInt | typeof TFloat | typeof TSym | typeof KTrue | typeof KFalse
    >,
  ) {
    super(token.start, token.end)
  }
}

export class TypeEmpty extends Type {
  constructor(readonly at: number) {
    super(at, at)
  }
}

export class TypeParen extends Type {
  constructor(
    readonly token: TokenGroup<typeof OLParen>,
    readonly of: Type,
  ) {
    super(token.start, token.end)
  }
}

export class TypeArray extends Type {
  constructor(
    readonly brack: TokenGroup<typeof OLBrack>,
    readonly of: Type,
    readonly semi: Token<typeof OSemi> | null,
    readonly sizes: PlainList<Expr>,
  ) {
    super(brack.start, brack.end) // brack.end since it encloses everything
  }
}

export class TypeBlock extends Type {
  constructor(readonly block: ExprBlock) {
    super(block.start, block.end)
  }
}
