import type {
  KFalse,
  KTrue,
  ODot,
  TFloat,
  TIdent,
  TIgnore,
  TInt,
  TSym,
} from "../kind"
import type { Token } from "../token"
import type { List, StructPatProp } from "./extra"
import { Node } from "./node"

export abstract class NodePat extends Node {
  declare private __brand_pat
}

export class PatIgnore extends NodePat {
  constructor(readonly name: Token<typeof TIgnore>) {
    super(name.start, name.end)
  }
}

export class PatVar extends NodePat {
  constructor(readonly name: Token<typeof TIdent>) {
    super(name.start, name.end)
  }
}

export class PatLit extends NodePat {
  constructor(
    readonly name: Token<
      typeof TFloat | typeof TInt | typeof TSym | typeof KTrue | typeof KFalse
    >,
  ) {
    super(name.start, name.end)
  }
}

export class PatStruct extends NodePat {
  constructor(
    readonly name: Token<typeof ODot | typeof TSym>,
    readonly of: List<StructPatProp> | null,
  ) {
    super(name.start, (of ?? name).end)
  }
}
