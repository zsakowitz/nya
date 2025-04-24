import type { Pos } from "../issue"
import type { TFloat, TIdent, TIgnore, TInt, TSym } from "../kind"
import type { Token } from "../token"
import { Node } from "./node"

export abstract class Pat extends Node {
  declare private __brand_pat
}

export class PatIgnore extends Pat {
  constructor(readonly name: Token<typeof TIgnore>) {
    super(name.start, name.end)
  }
}

export class PatVar extends Pat {
  constructor(readonly name: Token<typeof TIdent>) {
    super(name.start, name.end)
  }
}

export class PatLit extends Pat {
  constructor(readonly name: Token<typeof TFloat | typeof TInt | typeof TSym>) {
    super(name.start, name.end)
  }
}

export class PatEmpty extends Pat {
  constructor(pos: Pos) {
    super(pos.start, pos.end)
  }
}
