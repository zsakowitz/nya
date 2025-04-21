import type { Print } from "./ast-print"
import { createGroups } from "./group"
import { TBuiltin, TFloat, TIdent, TInt, TSym } from "./kind"
import { Code, Issue, Token, tokens, type ToTokensProps } from "./token"

export function parseToStream(source: string, props: ToTokensProps) {
  const { issues, ret: raw } = tokens(source, props)
  const ret = createGroups(raw, issues)
  return new Stream(source, ret, issues)
}

export class Stream {
  constructor(
    readonly source: string,
    readonly tokens: Token<number>[],
    readonly issues: Issue[],
  ) {}

  issue(code: Code, start: number, end: number) {
    this.issues.push(new Issue(code, start, end))
  }

  content(token: { start: number; end: number }) {
    return this.source.slice(token.start, token.end)
  }

  match<K extends number>(k: K): Token<K> | null {
    const next = this.tokens[this.tokens.length - 1]
    if (next?.is(k)) {
      this.tokens.pop()
      return next
    } else {
      return null
    }
  }

  peek(): number | null {
    return this.tokens[this.tokens.length - 1]?.kind ?? null
  }
}

export abstract class Node {
  constructor(
    readonly start: number,
    readonly end: number,
  ) {}

  [x: string]: Print
}

export abstract class Expr extends Node {
  declare private _exprbrand
}

export class ExprLit extends Expr {
  constructor(
    readonly value: Token<typeof TFloat | typeof TInt | typeof TSym>,
  ) {
    super(value.start, value.end)
  }
}

function exprLit(stream: Stream) {
  const token = stream.match(TFloat) || stream.match(TInt) || stream.match(TSym)
  if (token) return new ExprLit(token)
}

export class ExprVar extends Expr {
  constructor(readonly name: Token<typeof TIdent | typeof TBuiltin>) {
    super(name.start, name.end)
  }
}

function exprVar(stream: Stream) {
  const token = stream.match(TIdent) || stream.match(TBuiltin)
  if (token) return new ExprVar(token)
}

function exprAtom(stream: Stream) {
  switch (stream.peek()) {
    case TFloat:
    case TInt:
    case TSym:
      return exprLit(stream)

    case TIdent:
    case TBuiltin:
      return exprVar(stream)
  }
}

export function parse(stream: Stream) {
  return exprAtom(stream)
}
