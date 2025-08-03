import type { Chunk } from "../issue"
import type {
  KAny,
  KFalse,
  KSyntax,
  KTrue,
  OBar,
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
import type { ExprBlock, NodeExpr } from "./expr"
import type { Bracketed, List, PlainList } from "./extra"
import { Node } from "./node"

export abstract class NodeType extends Node {
  declare private __brand_type
}

export class TypeSyntax extends NodeType {
  constructor(readonly kw: Token<typeof KSyntax>) {
    super(kw.start, kw.end, kw.info)
  }
}

export class TypeAny extends NodeType {
  constructor(
    readonly kw: Token<typeof KAny>,
    readonly of: NodeType,
  ) {
    super(kw.start, of.end, kw.info)
  }
}

export class TypeVar extends NodeType {
  constructor(
    readonly name: Token<typeof TIdent>,
    readonly targs: List<NodeType> | null,
  ) {
    super(name.start, (targs ?? name).end, name.info)
  }
}

export class TypeLit extends NodeType {
  constructor(
    readonly token: Token<
      typeof TInt | typeof TFloat | typeof TSym | typeof KTrue | typeof KFalse
    >,
  ) {
    super(token.start, token.end, token.info)
  }
}

export class TypeEmpty extends NodeType {
  constructor(
    readonly at: number,
    info: Chunk,
  ) {
    super(at, at, info)
  }
}

export class TypeParen extends NodeType {
  constructor(
    readonly token: TokenGroup<typeof OLParen>,
    readonly of: NodeType,
  ) {
    super(token.start, token.end, token.info)
  }
}

export class TypeArrayUnsized extends NodeType {
  constructor(readonly of: Bracketed<typeof OLBrack, NodeType>) {
    super(of.start, of.end, of.info) // brack.end since it encloses everything
  }
}

export class TypeArray extends NodeType {
  constructor(
    readonly brack: TokenGroup<typeof OLBrack>,
    readonly of: NodeType,
    readonly semi: Token<typeof OSemi> | null,
    readonly sizes: PlainList<NodeExpr>,
  ) {
    super(brack.start, brack.end, brack.info) // brack.end since it encloses everything
  }
}

export class TypeAlt extends NodeType {
  constructor(
    readonly lhs: NodeType,
    readonly op: Token<typeof OBar> | null,
    readonly rhs: NodeType,
  ) {
    super(lhs.start, rhs.end, lhs.info)
  }
}

export class TypeBlock extends NodeType {
  constructor(readonly block: ExprBlock) {
    super(block.start, block.end, block.info)
  }
}
