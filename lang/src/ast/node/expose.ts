import type {
  KFn,
  KLet,
  KType,
  OColon,
  OEq,
  OSemi,
  TIgnore,
  TString,
} from "../kind"
import type { Token } from "../token"
import type { Expr } from "./expr"
import type { ExposeAliases, List } from "./extra"
import { Node, type IdentFnName } from "./node"
import type { Type } from "./type"

export class Expose extends Node {
  declare private __brand_expose
}

export class ExposeFn extends Expose {
  constructor(
    readonly kw: Token<typeof KFn>,
    readonly name: IdentFnName | null,
    readonly label: Token<typeof TString> | null,
    readonly as: ExposeAliases | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? as ?? label ?? name ?? kw).end)
  }
}

export class ExposeType extends Expose {
  constructor(
    readonly kw: Token<typeof KType>,
    readonly name: IdentFnName | null,
    readonly targs: List<Type> | null,
    readonly label: Token<typeof TString> | null,
    readonly as: ExposeAliases | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? as ?? label ?? targs ?? name ?? kw).end)
  }
}

export class ExposeLet extends Expose {
  constructor(
    readonly kw: Token<typeof KLet>,
    readonly name: IdentFnName | Token<typeof TIgnore> | null,
    readonly label: Token<typeof TString> | null,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type | null,
    readonly as: ExposeAliases | null,
    readonly eq: Token<typeof OEq> | null,
    readonly value: Expr,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? as ?? type ?? colon ?? label ?? name ?? kw).end)
  }
}
