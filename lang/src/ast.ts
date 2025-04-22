import type { Print } from "./ast-print"
import { createGroups } from "./group"
import {
  AAmp,
  AAmpAmp,
  AAt,
  ABackslash,
  ABang,
  ABar,
  ABarBar,
  ADotDot,
  AEqEq,
  AGe,
  AGt,
  ALe,
  ALt,
  AMinus,
  ANe,
  APercent,
  APlus,
  ASlash,
  AStar,
  AStarStar,
  ATilde,
  OAmp,
  OAmpAmp,
  OAt,
  OBackslash,
  OBang,
  OBar,
  OBarBar,
  ODotDot,
  OEqEq,
  OGe,
  OGt,
  OLe,
  OLt,
  OMinus,
  ONe,
  OPercent,
  OPlus,
  OSlash,
  OStar,
  OStarStar,
  OTilde,
  TBuiltin,
  TFloat,
  TIdent,
  TInt,
  TSym,
} from "./kind"
import { Code, Issue, Token, tokens, type ToTokensProps } from "./token"

export function parseToStream(source: string, props: ToTokensProps) {
  const { issues, ret: raw } = tokens(source, props)
  const ret = createGroups(raw, issues)
  ret.reverse()
  return new Stream(source, ret, issues)
}

export class Stream {
  constructor(
    readonly source: string,
    readonly tokens: Token<number>[],
    readonly issues: Issue[],
  ) {}

  loc() {
    return this.tokens[this.tokens.length - 1]?.start ?? this.source.length
  }

  issue(code: Code, start: number, end: number) {
    this.issues.push(new Issue(code, start, end))
  }

  content(token: { start: number; end: number }) {
    return this.source.slice(token.start, token.end)
  }

  match<K extends number>(k: K): Token<K> | null {
    const next = this.tokens[this.tokens.length - 1]
    if (next && next.kind == k) {
      this.tokens.pop()
      return next as Token<K>
    } else {
      return null
    }
  }

  matchAny<const K extends readonly number[]>(k: K): Token<K[number]> | null {
    const next = this.tokens[this.tokens.length - 1]
    if (next && k.includes(next.kind)) {
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

export class ExprEmpty extends Expr {
  constructor(readonly at: number) {
    super(at, at)
  }
}

function exprAtom(stream: Stream): Expr {
  switch (stream.peek()) {
    case TFloat:
    case TInt:
    case TSym:
      return exprLit(stream)!

    case TIdent:
    case TBuiltin:
      return exprVar(stream)!
  }

  stream.issue(Code.ExpectedExpression, stream.loc(), stream.loc())
  return new ExprEmpty(stream.loc())
}

function exprPropChain(stream: Stream) {
  return exprAtom(stream)
}

type ExprUnaryOp =
  | typeof OMinus
  | typeof AMinus
  | typeof OTilde
  | typeof ATilde
  | typeof OBang
  | typeof ABang

export class ExprUnary extends Expr {
  constructor(
    readonly op: Token<ExprUnaryOp>,
    readonly of: Expr,
  ) {
    super(op.start, of.end)
  }
}

function exprUnary(stream: Stream): Expr {
  let ops = []
  let match
  while (
    (match =
      stream.match(OMinus) ||
      stream.match(AMinus) ||
      stream.match(OTilde) ||
      stream.match(ATilde) ||
      stream.match(OBang) ||
      stream.match(ABang))
  ) {
    ops.push(match)
  }

  let expr = exprPropChain(stream)
  while (ops[0]) {
    expr = new ExprUnary(ops.pop()!, expr)
  }
  return expr
}

type ExprBinaryOp =
  | typeof OPlus
  | typeof OMinus
  | typeof OStar
  | typeof OSlash
  | typeof OStarStar
  | typeof OBar
  | typeof OAmp
  | typeof OBarBar
  | typeof OAmpAmp
  | typeof OAt
  | typeof OBackslash
  | typeof OEqEq
  | typeof ONe
  | typeof OLe
  | typeof OGe
  | typeof OLt
  | typeof OGt
  | typeof ODotDot
  | typeof APlus
  | typeof AMinus
  | typeof AStar
  | typeof ASlash
  | typeof AStarStar
  | typeof ABar
  | typeof AAmp
  | typeof ABarBar
  | typeof AAmpAmp
  | typeof AAt
  | typeof ABackslash
  | typeof AEqEq
  | typeof ANe
  | typeof ALe
  | typeof AGe
  | typeof ALt
  | typeof AGt
  | typeof ADotDot
  | typeof OPercent
  | typeof APercent

export class ExprBinary extends Expr {
  constructor(
    readonly lhs: Expr,
    readonly op: Token<ExprBinaryOp>,
    readonly rhs: Expr,
  ) {
    super(lhs.start, rhs.end)
  }
}

function exprBinarySingle(
  permitted: ExprBinaryOp[],
  side: (stream: Stream) => Expr,
) {
  return (stream: Stream): Expr => {
    const lhs = side(stream)
    const op = stream.matchAny(permitted)
    if (op) {
      const rhs = side(stream)
      return new ExprBinary(lhs, op, rhs)
    } else {
      return lhs
    }
  }
}

function exprBinaryAssocL(
  permitted: ExprBinaryOp[],
  side: (stream: Stream) => Expr,
) {
  return (stream: Stream): Expr => {
    let expr = side(stream)
    let op
    while ((op = stream.matchAny(permitted)))
      expr = new ExprBinary(expr, op, side(stream))
    return expr
  }
}

const exprBinaryOp = exprBinaryAssocL(
  [OBarBar, ABarBar],
  exprBinaryAssocL(
    [OAmpAmp, AAmpAmp],
    exprBinarySingle(
      [OEqEq, ONe, OLt, OGt, OLe, OGe, AEqEq, ANe, ALt, AGt, ALe, AGe],
      exprBinaryAssocL(
        [OBar, ABar],
        exprBinaryAssocL(
          [OAmp, AAmp],
          exprBinaryAssocL(
            [OPlus, OMinus, OPercent, APlus, AMinus, APercent],
            exprBinaryAssocL(
              [OStar, OSlash, AStar, ASlash],
              exprBinarySingle(
                // easier to ban multiple exponentiation
                [OStarStar, AStarStar],
                exprBinarySingle(
                  // multiple ranges don't make sense
                  [ODotDot, ADotDot],
                  exprBinarySingle(
                    // backslash will be for fractions
                    [OBackslash, ABackslash],
                    exprUnary,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
)

export function parse(stream: Stream) {
  return exprBinaryOp(stream)
}
