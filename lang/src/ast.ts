import type { Print } from "./ast-print"
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
  OLParen,
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
import { TokenGroup, type Stream } from "./stream"
import { Code, Token } from "./token"

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

export class ExprParen extends Expr {
  constructor(
    readonly token: TokenGroup<typeof OLParen>,
    readonly of: Expr,
  ) {
    super(token.start, token.end)
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

    case OLParen:
      const token = stream.matchGroup(OLParen)!
      return new ExprParen(token, expr(token.contents))
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

function expr(stream: Stream) {
  return exprBinaryOp(stream)
}

export function parse(stream: Stream) {
  return expr(stream)
}
