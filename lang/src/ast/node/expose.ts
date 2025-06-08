import type { KFn, KLet, KType, OEq, OSemi, TIgnore, TString } from "../kind"
import type { Token } from "../token"
import type { NodeExpr } from "./expr"
import type { ExposeAliases, List, ParamType } from "./extra"
import { Node, type IdentFnName } from "./node"
import type { NodeType } from "./type"

export class NodeExpose extends Node {
  declare private __brand_expose
}

export class ExposeFn extends NodeExpose {
  constructor(
    readonly kw: Token<typeof KFn>,
    readonly name: IdentFnName | null,
    readonly label: Token<typeof TString> | null,
    readonly as: ExposeAliases | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? as ?? label ?? name ?? kw).end, kw.info)
  }
}

export class ExposeType extends NodeExpose {
  constructor(
    readonly kw: Token<typeof KType>,
    readonly name: IdentFnName | null,
    readonly targs: List<NodeType> | null,
    readonly as: ExposeAliases | null,
    readonly label: Token<typeof TString> | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? as ?? label ?? targs ?? name ?? kw).end, kw.info)
  }
}

export class ExposeLet extends NodeExpose {
  constructor(
    readonly kw: Token<typeof KLet>,
    readonly name: IdentFnName | Token<typeof TIgnore> | null,
    readonly as: ExposeAliases | null,
    readonly label: Token<typeof TString> | null,
    readonly type: ParamType | null,
    readonly eq: Token<typeof OEq> | null,
    readonly value: NodeExpr,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? as ?? type ?? label ?? name ?? kw).end, kw.info)
  }
}
