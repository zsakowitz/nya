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
  KElse,
  KIf,
  OAmp,
  OAmpAmp,
  OAt,
  OBackslash,
  OBang,
  OBar,
  OBarBar,
  OComma,
  ODot,
  ODotDot,
  OEqEq,
  OGe,
  OGt,
  OLBrace,
  OLBrack,
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
  type Brack,
} from "./kind"
import { Stream, TokenGroup } from "./stream"
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
  constructor(
    readonly name: Token<typeof TIdent | typeof TBuiltin>,
    readonly args: List<Expr> | null,
  ) {
    super(name.start, name.end)
  }
}

export class ExprStruct extends Expr {
  constructor(
    readonly name: Token<typeof TIdent | typeof TBuiltin>,
    readonly args: List<Expr> | null,
  ) {
    super(name.start, name.end)
  }
}

interface ExprContext {
  struct: boolean
}

function exprVar(stream: Stream, ctx: ExprContext) {
  const token = stream.match(TIdent) || stream.match(TBuiltin)
  if (token) {
    const struct = ctx.struct && structArguments(stream)
    if (struct) {
      return new ExprStruct(token, struct)
    } else {
      return new ExprVar(token, fnArguments(stream))
    }
  }
}

export class ExprEmpty extends Expr {
  constructor(readonly at: number) {
    super(at, at)
  }
}

export class ExprIf extends Expr {
  constructor(
    readonly kwIf: Token<typeof KIf>,
    readonly condition: Expr,
    readonly blockIf: Block | null,
    readonly kwElse: Token<typeof KElse> | null,
    readonly blockElse: Block | ExprIf | null,
  ) {
    super(kwIf.start, blockIf?.end ?? condition.end)
  }
}

export function exprIf(stream: Stream): ExprIf | null {
  const kwIf = stream.match(KIf)
  if (!kwIf) return null

  const condition = expr(stream, { struct: false })
  const blockIf = block(stream)

  const kwElse = stream.match(KElse)
  if (!kwElse) {
    return new ExprIf(kwIf, condition, blockIf, null, null)
  }

  if (stream.peek() == KIf) {
    return new ExprIf(kwIf, condition, blockIf, kwElse, exprIf(stream))
  } else if (stream.peek() == OLBrace) {
    return new ExprIf(kwIf, condition, blockIf, kwElse, block(stream))
  } else {
    stream.issueOnNext(Code.IfOrBlockMustFollowElse)
    return new ExprIf(kwIf, condition, blockIf, null, null)
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

export class ExprArray extends Expr {
  constructor(readonly of: List<Expr>) {
    super(of.start, of.end)
  }
}

function exprAtom(stream: Stream, ctx: ExprContext): Expr {
  switch (stream.peek()) {
    case TFloat:
    case TInt:
    case TSym:
      return exprLit(stream)!

    case TIdent:
    case TBuiltin:
      return exprVar(stream, ctx)!

    case OLParen: {
      const token = stream.matchGroup(OLParen)!
      return new ExprParen(token, exprFull(token.contents))
    }

    case OLBrack: {
      const e = listValues(stream)!
      return new ExprArray(e)
    }

    case OLBrace:
      return block(stream)!

    case KIf:
      return exprIf(stream)!
  }

  stream.issue(Code.ExpectedExpression, stream.loc(), stream.loc())
  return new ExprEmpty(stream.loc())
}

export class ExprCall extends Expr {
  constructor(
    readonly on: Expr,
    readonly args: List<Expr>,
  ) {
    super(on.start, args.end)
  }
}

export class ExprProp extends Expr {
  constructor(
    readonly on: Expr,
    readonly dot: Token<typeof ODot>,
    readonly name: Token<typeof TIdent> | null,
    readonly args: List<Expr> | null,
  ) {
    super(on.start, name?.end ?? dot.end)
  }
}

export class ExprIndex extends Expr {
  constructor(
    readonly on: Expr,
    readonly brack: TokenGroup<typeof OLBrack>,
    readonly index: Expr,
  ) {
    super(on.start, brack.end)
  }
}

function exprPropChain(stream: Stream, ctx: ExprContext) {
  let expr = exprAtom(stream, ctx)

  loop: while (true) {
    switch (stream.peek()) {
      case OLParen:
        const m = fnArguments(stream)
        if (m) {
          expr = new ExprCall(expr, m)
          continue
        } else {
          break loop
        }

      case OLBrack:
        const n = stream.matchGroup(OLBrack)!
        expr = new ExprIndex(expr, n, exprFull(n.contents))
        continue

      case ODot:
        expr = new ExprProp(
          expr,
          stream.match(ODot)!,
          stream.match(TIdent),
          fnArguments(stream),
        )
        continue
    }

    break
  }

  return expr
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

function exprUnary(stream: Stream, ctx: ExprContext): Expr {
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

  let expr = exprPropChain(stream, ctx)
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

function createBinOp1(
  permitted: ExprBinaryOp[],
  side: (stream: Stream, ctx: ExprContext) => Expr,
) {
  return (stream: Stream, ctx: ExprContext): Expr => {
    const lhs = side(stream, ctx)
    const op = stream.matchAny(permitted)
    if (op) {
      const rhs = side(stream, ctx)
      return new ExprBinary(lhs, op, rhs)
    } else {
      return lhs
    }
  }
}

function createBinOpL(
  permitted: ExprBinaryOp[],
  side: (stream: Stream, ctx: ExprContext) => Expr,
) {
  return (stream: Stream, ctx: ExprContext): Expr => {
    let expr = side(stream, ctx)
    let op
    while ((op = stream.matchAny(permitted)))
      expr = new ExprBinary(expr, op, side(stream, ctx))
    return expr
  }
}

const exprBinaryOp = createBinOpL(
  [OBarBar, ABarBar],
  createBinOpL(
    [OAmpAmp, AAmpAmp],
    createBinOp1(
      [OEqEq, ONe, OLt, OGt, OLe, OGe, AEqEq, ANe, ALt, AGt, ALe, AGe],
      createBinOpL(
        [OBar, ABar],
        createBinOpL(
          [OAmp, AAmp],
          createBinOpL(
            [OPlus, OMinus, OPercent, APlus, AMinus, APercent],
            createBinOpL(
              [OStar, OSlash, AStar, ASlash],
              createBinOp1(
                // easier to ban multiple exponentiation
                [OStarStar, AStarStar],
                createBinOp1(
                  // multiple ranges don't make sense
                  [ODotDot, ADotDot],
                  createBinOp1(
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

function expr(stream: Stream, ctx: ExprContext = { struct: true }) {
  return exprBinaryOp(stream, ctx)
}

function exprFull(stream: Stream) {
  const e = expr(stream, { struct: true })
  stream.requireDone()
  return e
}

export class List<T extends Node> extends Node {
  constructor(
    readonly bracket: TokenGroup,
    readonly items: T[],
  ) {
    super(bracket.start, bracket.end)
  }
}

function createCommaOp<T extends Node>(
  bracket: Brack,
  fn: (stream: Stream) => T,
) {
  return (stream: Stream) => {
    const group = stream.matchGroup(bracket)
    if (!group) return null

    const list = new List<T>(group, [])
    if (!group.contents.isEmpty()) {
      const first = fn(group.contents)
      list.items.push(first)

      while (group.contents.match(OComma)) {
        list.items.push(fn(group.contents))
      }

      group.contents.match(OComma)
    }

    return list
  }
}

const fnArguments = createCommaOp(OLParen, expr)
const structArguments = createCommaOp(OLBrace, expr)
const listValues = createCommaOp(OLBrack, expr)

export class Block extends Expr {
  constructor(
    readonly bracket: TokenGroup,
    readonly of: Expr,
  ) {
    super(bracket.start, of.end)
  }
}

function block(stream: Stream) {
  const group = stream.matchGroup(OLBrace)
  if (!group) return null

  return new Block(group, exprFull(group.contents))
}

export function parse(stream: Stream) {
  return exprFull(stream)
}
