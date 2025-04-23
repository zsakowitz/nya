import type { Print } from "./ast-print"
import {
  AAmp,
  AAmpAmp,
  AArrowRet,
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
  KBreak,
  KContinue,
  KElse,
  KEnum,
  KFn,
  KFor,
  KIf,
  KIn,
  KLet,
  KMatch,
  KReturn,
  KRule,
  KSource,
  KStruct,
  KType,
  KUsage,
  KUse,
  OAmp,
  OAmpAmp,
  OArrowMap,
  OArrowRet,
  OAt,
  OBackslash,
  OBang,
  OBar,
  OBarBar,
  OColon,
  OColonColon,
  OComma,
  ODot,
  ODotDot,
  OEq,
  OEqEq,
  OGe,
  OGt,
  OLAngle,
  OLBrace,
  OLBrack,
  OLe,
  OLInterp,
  OLParen,
  OLt,
  OMinus,
  ONe,
  OPercent,
  OPlus,
  OSemi,
  OSlash,
  OStar,
  OStarStar,
  OTilde,
  OVERLOADABLE,
  TBuiltin,
  TDeriv,
  TDerivIgnore,
  TFloat,
  TIdent,
  TIgnore,
  TInt,
  TLabel,
  TSource,
  TString,
  TSym,
  type Brack,
  type OOverloadable,
} from "./kind"
import { Stream, TokenGroup } from "./stream"
import { Code, Token } from "./token"

export type Ident = Token<typeof TIdent>
export type IdentFnName = Token<typeof TIdent> | Token<OOverloadable>

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

export abstract class Type extends Node {
  declare private __brand_type
}

export abstract class Pat extends Node {}

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
  constructor(readonly at: number) {
    super(at, at)
  }
}

function patAtom(stream: Stream) {
  switch (stream.peek()) {
    case TIgnore:
      return new PatIgnore(stream.match(TIgnore)!)

    case TIdent:
      return new PatVar(stream.match(TIdent)!)

    case TInt:
    case TFloat:
    case TSym:
      return new PatLit(stream.matchAny([TInt, TFloat, TSym])!)
  }

  stream.raiseNext(Code.ExpectedPat)
  return new PatEmpty(stream.loc())
}

function pat(stream: Stream): Pat {
  return patAtom(stream)
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
    readonly token: Token<typeof TInt | typeof TFloat | typeof TSym>,
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
    super(brack.start, sizes.end)
  }
}

const arraySizes = createUnbracketedCommaOp(expr, Code.ExpectedExpression)

function typeArray(stream: Stream) {
  const group = stream.matchGroup(OLBrack)
  if (!group) return null

  const of = type(group.contents)
  const semi = group.contents.matchOr(OSemi, Code.MissingSemi)
  const exprs = arraySizes(group.contents)
  return new TypeArray(group, of, semi, exprs)
}

function type(stream: Stream): Type {
  switch (stream.peek()) {
    case TIdent:
      return new TypeVar(stream.match(TIdent)!, typeArgs(stream))

    case TInt:
    case TFloat:
    case TSym:
      return new TypeLit(stream.matchAny([TInt, TFloat, TSym])!)

    case OLBrace:
      return new TypeBlock(block(stream)!)

    case OLParen:
      const token = stream.matchGroup(OLParen)!
      return new TypeParen(token, token.contents.full(type))

    case OLBrack:
      return typeArray(stream)!
  }

  stream.raiseNext(Code.ExpectedType)
  return new TypeEmpty(stream.loc())
}

const typeArgs = createCommaOp(OLAngle, type, null)

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
    readonly targs: List<Type> | null,
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
  noErrorOnEmpty?: boolean
}

function exprVar(stream: Stream, ctx: ExprContext) {
  const token = stream.match(TIdent) || stream.match(TBuiltin)
  if (token) {
    const struct = ctx.struct && structArgs(stream)
    if (struct) {
      return new ExprStruct(token, struct)
    } else {
      return new ExprVar(token, typeArgs(stream), callArgs(stream))
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
    readonly blockIf: ExprBlock | null,
    readonly kwElse: Token<typeof KElse> | null,
    readonly blockElse: ExprBlock | ExprIf | null,
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
    stream.raiseNext(Code.IfOrBlockMustFollowElse)
    return new ExprIf(kwIf, condition, blockIf, null, null)
  }
}

export class ExprFor extends Expr {
  constructor(
    readonly kw: Token<typeof KFor>,
    readonly bound: PlainList<Ident>,
    readonly eq: Token<typeof KIn> | null,
    readonly sources: PlainList<Expr>,
    readonly block: ExprBlock | null,
  ) {
    super(kw.start, block?.end ?? sources.end)
  }
}

const forBindings = createUnbracketedCommaOp(
  (stream) => stream.match(TIdent),
  Code.ExpectedForBindings,
)
const forSources = createUnbracketedCommaOp(
  (stream) => expr(stream, { struct: false }),
  Code.ExpectedForSources,
)

export function exprFor(stream: Stream): ExprFor | null {
  const kw = stream.match(KFor)
  if (!kw) return null

  return new ExprFor(
    kw,
    forBindings(stream),
    stream.matchOr(KIn, Code.ExpectedIn),
    forSources(stream),
    block(stream),
  )
}

export class ExprExit extends Expr {
  constructor(
    readonly kw: Token<typeof KReturn | typeof KBreak | typeof KContinue>,
    readonly label: Token<typeof TLabel> | null,
    readonly value: Expr | null,
  ) {
    super(kw.start, (value ?? label ?? kw).end)
  }
}

export function exprExit(stream: Stream, ctx: ExprContext): ExprExit | null {
  const kw = stream.matchAny([KReturn, KBreak, KContinue])
  if (!kw) return null

  const label = stream.match(TLabel)
  let value: Expr | null = expr(stream, {
    struct: ctx.struct,
    noErrorOnEmpty: true,
  })
  if (value instanceof ExprEmpty) value = null

  if (kw.kind == KReturn) {
    if (label) {
      stream.raise(Code.InvalidLabeledExit, label.start, label.end)
    }
  } else if (kw.kind == KContinue) {
    if (value) {
      stream.raise(Code.InvalidValuedExit, value.start, value.end)
    }
  }

  return new ExprExit(kw, label, value)
}

export class MatchArm extends Node {
  constructor(
    readonly pat: Pat,
    readonly arrow: Token<typeof OArrowMap> | null,
    readonly expr: Expr,
  ) {
    super(pat.start, expr.end)
  }
}

function matchArm(stream: Stream) {
  return new MatchArm(
    pat(stream),
    stream.matchOr(OArrowMap, Code.ExpectedMatchArrow),
    expr(stream),
  )
}

export class ExprMatch extends Expr {
  constructor(
    readonly kw: Token<typeof KMatch>,
    readonly on: Expr,
    readonly arms: List<MatchArm> | null,
  ) {
    super(kw.start, (arms ?? kw).end)
  }
}

const arms = createCommaOp(OLBrace, matchArm, Code.ExpectedMatchArms)

function exprMatch(stream: Stream) {
  const kw = stream.match(KMatch)
  if (!kw) return null

  return new ExprMatch(kw, expr(stream, { struct: false }), arms(stream))
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

export class ExprArrayByRepetition extends Expr {
  constructor(
    readonly brack: TokenGroup<typeof OLBrack>,
    readonly of: Expr,
    readonly semi: Token<typeof OSemi> | null,
    readonly sizes: PlainList<Expr>,
  ) {
    super(brack.start, sizes.end)
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
      return new ExprParen(token, token.contents.full(expr))
    }

    case OLBrack: {
      const lt = stream.matchGroup(OLBrack)!
      const first = expr(lt.contents)

      switch (lt.contents.peek()) {
        case OSemi:
          const semi = lt.contents.match(OSemi)!
          const sizes = arraySizes(lt.contents)
          return new ExprArrayByRepetition(lt, first, semi, sizes)

        case OComma:
          const items = [first]
          while (lt.contents.match(OComma)) {
            if (lt.contents.isDone()) {
              break
            }
            items.push(expr(lt.contents))
          }
          return new ExprArray(new List(lt, items, null))

        case null:
          return new ExprArray(new List(lt, [first], null))
      }

      lt.contents.raiseNext(Code.ExpectedCommaOrSemi)
      return new ExprArray(new List(lt, [first], null))
    }

    case OLBrace:
      return block(stream)!

    case KIf:
      return exprIf(stream)!

    case KFor:
      return exprFor(stream)!

    case KSource:
      return source(stream)!

    case KReturn:
    case KBreak:
    case KContinue:
      return exprExit(stream, ctx)!

    case KMatch:
      return exprMatch(stream)!
  }

  if (!ctx.noErrorOnEmpty) {
    stream.raise(Code.ExpectedExpression, stream.loc(), stream.loc())
  }
  return new ExprEmpty(stream.loc())
}

export class ExprCall extends Expr {
  constructor(
    readonly on: Expr,
    readonly targs: List<Type> | null,
    readonly args: List<Expr> | null,
  ) {
    super(on.start, (args ?? targs ?? on).end)
  }
}

export class ExprProp extends Expr {
  constructor(
    readonly on: Expr,
    readonly dot: Token<typeof ODot>,
    readonly name: Token<typeof TIdent> | null,
    readonly targs: List<Type> | null,
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
  let exp = exprAtom(stream, ctx)

  loop: while (true) {
    switch (stream.peek()) {
      case OLAngle:
        const t = typeArgs(stream)!
        const a = callArgs(stream)
        exp = new ExprCall(exp, t, a)
        continue

      case OLParen:
        const m = callArgs(stream)
        if (m) {
          exp = new ExprCall(exp, null, m)
          continue
        } else {
          break loop
        }

      case OLBrack:
        const n = stream.matchGroup(OLBrack)!
        exp = new ExprIndex(exp, n, n.contents.full(expr))
        continue

      case ODot:
        exp = new ExprProp(
          exp,
          stream.match(ODot)!,
          stream.matchOr(TIdent, Code.ExpectedIdent),
          typeArgs(stream),
          callArgs(stream),
        )
        continue
    }

    break
  }

  return exp
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

// d/dx notation is used as a shorthand since we need to represent a lot of derivatives
export class ExprDeriv extends Expr {
  constructor(
    readonly wrt: Token<typeof TDeriv | typeof TDerivIgnore>,
    readonly of: Expr,
  ) {
    super(wrt.start, wrt.end)
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
      stream.match(ABang) ||
      stream.match(TDeriv) ||
      stream.match(TDerivIgnore))
  ) {
    ops.push(match)
  }

  let expr = exprPropChain(stream, ctx)
  while (ops[0]) {
    const a = ops.pop()!
    if (a.kind == TDeriv || a.kind == TDerivIgnore) {
      expr = new ExprDeriv(a, expr)
    } else {
      expr = new ExprUnary(a, expr)
    }
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
  | typeof OArrowRet
  | typeof AArrowRet

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
    while ((op = stream.matchAny(permitted))) {
      expr = new ExprBinary(expr, op, side(stream, ctx))
    }
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
                [OStarStar, AStarStar],
                createBinOp1(
                  [ODotDot, ADotDot],
                  createBinOpL(
                    [OArrowRet, AArrowRet], // typecast operator
                    createBinOp1([OBackslash, ABackslash], exprUnary),
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

export abstract class Stmt extends Node {
  declare private __brand_stmt
}

export class StmtExpr extends Stmt {
  constructor(
    readonly expr: Expr,
    readonly semi: Token<typeof OSemi> | null,
    /** `true` only if `expr` is a plain expr and has no semicolon. */
    readonly terminatesBlock: boolean,
  ) {
    super(expr.start, semi?.end ?? expr.end)
  }
}

export class StmtLet extends Stmt {
  constructor(
    readonly kw: Token<typeof KLet>,
    readonly ident: Ident | null,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type | null,
    readonly eq: Token<typeof OEq> | null,
    readonly value: Expr | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? value ?? eq ?? type ?? colon ?? ident ?? kw).end)
  }
}

function stmtLet(stream: Stream): StmtLet | null {
  const kw = stream.match(KLet)
  if (!kw) return null

  const ident = stream.matchOr(TIdent, Code.ExpectedIdent)
  const colon = stream.match(OColon)
  const ty = colon && type(stream)
  const eq = stream.match(OEq)
  const value = eq && expr(stream)
  const semi = stream.matchOr(OSemi, Code.MissingSemi)

  return new StmtLet(kw, ident, colon, ty, eq, value, semi)
}

function stmt(stream: Stream): Stmt | null {
  if (stream.isDone()) {
    return null
  }

  switch (stream.peek()) {
    case KLet:
      return stmtLet(stream)!

    case KIf:
      return new StmtExpr(exprIf(stream)!, stream.match(OSemi), false)

    case KFor:
      return new StmtExpr(exprFor(stream)!, stream.match(OSemi), false)

    case KMatch:
      return new StmtExpr(exprMatch(stream)!, stream.match(OSemi), false)

    default:
      const e = expr(stream)
      const semi = stream.match(OSemi)
      return new StmtExpr(e, semi, !semi)
  }
}

function expr(stream: Stream, ctx: ExprContext = { struct: true }) {
  return exprBinaryOp(stream, ctx)
}

export class PlainList<T extends Print> extends Node {
  constructor(
    readonly items: T[],
    start: number,
    end: number,
  ) {
    super(start, end)
  }
}

function createUnbracketedCommaOp<T extends Print & { end: number }>(
  fn: (stream: Stream) => T | null,
  onEmpty: Code,
) {
  return (stream: Stream) => {
    const list = new PlainList<T>([], stream.start, stream.start)
    const first = fn(stream)
    if (first) {
      list.items.push(first)
      let comma
      while ((comma = stream.match(OComma))) {
        const next = fn(stream)
        if (next) {
          list.items.push(next)
          ;(list as any).end = next.end
        } else {
          ;(list as any).end = comma.end
          break
        }
      }
    } else {
      stream.raiseNext(onEmpty)
    }

    return list
  }
}

export class List<T extends Print, U extends Print | null = null> extends Node {
  constructor(
    readonly bracket: TokenGroup,
    readonly items: T[],
    readonly terminator: U,
  ) {
    super(bracket.start, bracket.end)
  }
}

function createCommaOp<
  T extends Print,
  U extends (Print & { end: number }) | null = null,
>(
  bracket: Brack,
  fn: (stream: Stream) => T | null,
  code: Code | null,
  terminator?: (stream: Stream) => U | null,
) {
  return (stream: Stream) => {
    const group = stream.matchGroup(bracket)
    if (!group) {
      if (code != null) {
        stream.raiseNext(code)
      }
      return null
    }

    const list = new List<T, U | null>(group, [], null)
    if (!group.contents.isEmpty()) {
      const first = fn(group.contents)
      if (!first) {
        const tx = terminator?.(group.contents)
        if (tx != null) {
          ;(list as any).terminator = tx
          ;(list as any).end = tx.end
        }
        group.contents.requireDone()
        return list
      }
      list.items.push(first)

      while (group.contents.match(OComma)) {
        if (group.contents.isDone()) {
          break
        }
        const val = fn(group.contents)
        if (!val) {
          const tx = terminator?.(group.contents)
          if (tx != null) {
            ;(list as any).terminator = tx
            ;(list as any).end = tx.end
          }
          group.contents.requireDone()
          return list
        }
        list.items.push(val)
      }

      group.contents.requireDone()
    }

    return list
  }
}

const callArgs = createCommaOp(OLParen, expr, null)
const structArgs = createCommaOp(OLBrace, expr, null)

export class ExprBlock extends Expr {
  constructor(
    readonly bracket: TokenGroup,
    readonly of: Stmt[],
  ) {
    super(bracket.start, of[of.length - 1]?.end ?? bracket.end)
  }
}

export class TypeBlock extends Type {
  constructor(readonly block: ExprBlock) {
    super(block.start, block.end)
  }
}

function block(stream: Stream) {
  const group = stream.matchGroup(OLBrace)
  if (!group) {
    stream.raiseNext(Code.ExpectedBlock)
    return null
  }

  const list: Stmt[] = []
  let a
  while ((a = stmt(group.contents))) {
    list.push(a)
    if (a instanceof StmtExpr && a.terminatesBlock) {
      break
    }
  }
  group.contents.requireDone()

  return new ExprBlock(group, list)
}

export class SourceSingle extends Expr {
  constructor(
    readonly kw: Token<typeof KSource>,
    readonly lang: Ident | null,
    readonly braces: TokenGroup<typeof OLBrace> | null,
    readonly parts: Token<typeof TSource>[],
    readonly interps: SourceInterp[],
  ) {
    super(kw.start, (braces ?? lang ?? kw).end)
  }
}

export class Source extends Expr {
  constructor(
    start: number,
    end: number,
    readonly parts: SourceSingle[],
    readonly castOp: Token<typeof OColonColon> | null,
    readonly cast: Type | null,
  ) {
    super(start, end)
  }
}

export class SourceInterp extends Expr {
  constructor(
    readonly bracket: TokenGroup<typeof OLInterp>,
    readonly of: Expr,
  ) {
    super(bracket.start, bracket.end)
  }
}

function sourceSingle(stream: Stream): SourceSingle | null {
  const kw = stream.match(KSource)
  if (!kw) return null

  const lang = stream.match(TIdent)

  const brace = stream.matchGroup(OLBrace)
  const parts = []
  const interps = []
  contents: if (brace) {
    const firstSource = brace.contents.match(TSource)
    if (firstSource) {
      parts.push(firstSource)
    } else break contents

    let m
    while ((m = brace.contents.matchGroup(OLInterp))) {
      interps.push(new SourceInterp(m, m.contents.full(expr)))
      const nextSource = brace.contents.match(TSource)
      if (nextSource) {
        parts.push(nextSource)
      } else break contents
    }
    brace.contents.requireDone()
  }

  return new SourceSingle(kw, lang, brace, parts, interps)
}

function source(stream: Stream): Source | null {
  const parts = []
  let m
  while ((m = sourceSingle(stream))) {
    parts.push(m)
  }
  if (!parts.length) {
    return null
  }

  const colon = stream.match(OColonColon)
  const ty = colon && type(stream)

  return new Source(
    parts[0]!.start,
    (ty ?? colon ?? parts[parts.length - 1]!).end,
    parts,
    colon,
    ty,
  )
}

export abstract class Item extends Node {
  declare private __brand_item
}

export class ItemType extends Item {
  constructor(
    readonly kw: Token<typeof KType>,
    readonly ident: Ident | null,
    readonly braces: TokenGroup<typeof OLBrace> | null,
    readonly source: Source | null,
  ) {
    super(kw.start, (braces ?? ident ?? kw).end)
  }
}

function itemType(stream: Stream) {
  const kw = stream.match(KType)
  if (!kw) return null

  const ident = stream.match(TIdent)
  const braces = stream.matchGroup(OLBrace)
  const s = braces && braces.contents.full(source)

  return new ItemType(kw, ident, braces, s)
}

export class FnParam extends Node {
  constructor(
    readonly ident: Ident,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type,
  ) {
    super(ident.start, type.end)
  }
}

function fnParam(stream: Stream) {
  const ident = stream.match(TIdent)
  if (!ident) return null

  const colon = stream.matchOr(OColon, Code.ExpectedColon)
  return new FnParam(ident, colon, type(stream))
}

export class ItemFn extends Item {
  constructor(
    readonly kw: Token<typeof KFn>,
    readonly name: IdentFnName | null,
    readonly params: List<FnParam> | null,
    readonly arrow: Token<typeof OArrowRet> | null,
    readonly retType: Type | null,
    readonly usageKw: Token<typeof KUsage> | null,
    readonly usages: PlainList<Expr> | null,
    readonly block: ExprBlock | null,
  ) {
    super(
      kw.start,
      (block ?? usages ?? usageKw ?? retType ?? arrow ?? params ?? name ?? kw)
        .end,
    )
  }
}

const fnParams = createCommaOp(OLParen, fnParam, Code.ExpectedFnParams)

function itemFn(stream: Stream) {
  const kw = stream.match(KFn)
  if (!kw) return null

  const ident = stream.match(TIdent) || stream.matchAny(OVERLOADABLE)
  if (!ident) stream.raiseNext(Code.ExpectedFnName)
  const p = fnParams(stream)
  const arrow = stream.match(OArrowRet) // not matchOr since return types are optional (void is implied)
  let ty = null
  if (arrow && stream.peek() == OLBrace) {
    stream.raiseNext(Code.ExpectedType)
  } else if (arrow) {
    ty = type(stream)
  }
  const usageKw = stream.match(KUsage)
  const usages = usageKw && fnUsageExamples(stream)

  return new ItemFn(kw, ident, p, arrow, ty, usageKw, usages, block(stream))
}

const fnUsageExamples = createUnbracketedCommaOp(
  (stream) => expr(stream, { struct: false }),
  Code.ExpectedForBindings,
)

export class ItemRule extends Item {
  constructor(
    readonly kw: Token<typeof KRule>,
    readonly lhs: Expr,
    readonly arrow: Token<typeof OArrowMap> | null,
    readonly rhs: Expr,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, rhs.end)
  }
}

function itemRule(stream: Stream) {
  const kw = stream.match(KRule)
  if (!kw) return null

  const lhs = expr(stream)
  const op = stream.match(OArrowMap)
  if (!op) {
    stream.raiseNext(Code.MissingRuleArrow)
  }
  const rhs = expr(stream)
  const semi = stream.match(OSemi)
  if (!semi) {
    stream.raiseNext(Code.MissingSemi)
  }

  return new ItemRule(kw, lhs, op, rhs, semi)
}

export class ItemUse extends Item {
  constructor(
    readonly kw: Token<typeof KUse>,
    readonly source: Token<typeof TString> | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? source ?? kw).end)
  }
}

function itemUse(stream: Stream) {
  const kw = stream.match(KUse)
  if (!kw) return null

  return new ItemUse(
    kw,
    stream.matchOr(TString, Code.ExpectedImportPath),
    stream.matchOr(OSemi, Code.MissingSemi),
  )
}

export class StructField extends Node {
  constructor(
    readonly name: Ident,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type,
  ) {
    super(name.start, type.end)
  }
}

function structField(stream: Stream) {
  const ident = stream.match(TIdent)
  if (!ident) return null

  return new StructField(
    ident,
    stream.matchOr(OColon, Code.ExpectedColon),
    type(stream),
  )
}

const structFields = createCommaOp(
  OLBrace,
  structField,
  Code.ExpectedStructFields,
)

function nonExhaustiveMarker(stream: Stream) {
  return stream.match(ODotDot)
}

const enumFields = createCommaOp(OLBrace, structField, null)

export class EnumVariant extends Node {
  constructor(
    readonly name: Token<typeof TSym>,
    readonly fields: List<StructField> | null,
  ) {
    super(name.start, (fields ?? name).end)
  }
}

export function enumVariant(stream: Stream) {
  const name = stream.match(TSym)
  if (!name) return null

  return new EnumVariant(name, enumFields(stream))
}

const enumVariants = createCommaOp(
  OLBrace,
  enumVariant,
  Code.ExpectedEnumVariants,
  nonExhaustiveMarker,
)

export class ItemEnum extends Item {
  constructor(
    readonly kw: Token<typeof KEnum>,
    readonly name: Ident | null,
    // readonly tparams: Type,
    readonly variants: List<EnumVariant, Token<typeof ODotDot> | null> | null,
  ) {
    super(kw.start, (variants ?? name ?? kw).end)
  }
}

export class EnumMapVariant extends Node {
  constructor(
    readonly name: Token<typeof TSym>,
    readonly arrow: Token<typeof OArrowMap> | null,
    readonly of: Expr,
  ) {
    super(name.start, of.end)
  }
}

function enumMapVariant(stream: Stream) {
  const name = stream.match(TSym)
  if (!name) return null

  return new EnumMapVariant(
    name,
    stream.matchOr(OArrowMap, Code.ExpectedEnumVariantValue),
    expr(stream),
  )
}

const enumMapVariants = createCommaOp(
  OLBrace,
  enumMapVariant,
  Code.ExpectedEnumVariants,
  nonExhaustiveMarker,
)

export class ItemEnumMap extends Item {
  constructor(
    readonly kw: Token<typeof KEnum>,
    readonly name: Ident | null,
    readonly arrow: Token<typeof OArrowRet>,
    readonly ret: Type,
    readonly variants: List<
      EnumMapVariant,
      Token<typeof ODotDot> | null
    > | null,
  ) {
    super(kw.start, (variants ?? ret).end)
  }
}

function itemEnum(stream: Stream) {
  const kw = stream.match(KEnum)
  if (!kw) return null

  const ident = stream.matchOr(TIdent, Code.ExpectedIdent)
  const arrow = stream.match(OArrowRet)

  if (arrow) {
    return new ItemEnumMap(
      kw,
      ident,
      arrow,
      type(stream),
      enumMapVariants(stream),
    )
  } else {
    return new ItemEnum(kw, ident, enumVariants(stream))
  }
}

export class ItemStruct extends Item {
  constructor(
    readonly kw: Token<typeof KStruct>,
    readonly name: Ident | null,
    // readonly tparams: Type,
    readonly fields: List<StructField, Token<typeof ODotDot> | null> | null,
  ) {
    super(kw.start, (fields ?? name ?? kw).end)
  }
}

function itemStruct(stream: Stream) {
  const kw = stream.match(KStruct)
  if (!kw) return null

  const ident = stream.matchOr(TIdent, Code.ExpectedIdent)

  return new ItemStruct(kw, ident, structFields(stream))
}

function item(stream: Stream): Item | null {
  switch (stream.peek()) {
    case KType:
      return itemType(stream)!

    case KFn:
      return itemFn(stream)!

    case KRule:
      return itemRule(stream)!

    case KUse:
      return itemUse(stream)!

    case KEnum:
      return itemEnum(stream)!

    case KStruct:
      return itemStruct(stream)!
  }

  return null
}

export class Script extends Node {
  constructor(
    readonly items: Item[],
    start: number,
    end: number,
  ) {
    super(start, end)
  }
}

function script(stream: Stream): Script {
  const items = []

  let m
  while ((m = item(stream))) {
    items.push(m)
  }
  stream.requireDone()

  return new Script(items, stream.start, stream.end)
}

export function parse(stream: Stream) {
  return script(stream)
}

// TODO:
// - let statement
// - enum variant with data expr
// - assignment
//
// ITEMS:
// - expose
