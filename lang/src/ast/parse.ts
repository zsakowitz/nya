import { Code, Pos } from "./issue"
import {
  AAmp,
  AAmpAmp,
  AAt,
  ABackslash,
  ABangUnary,
  ABar,
  ABarBar,
  AEq,
  AEqEq,
  AGe,
  AGt,
  ALe,
  ALt,
  AMinus,
  AMinusUnary,
  ANe,
  APercent,
  APlus,
  ASlash,
  AStar,
  AStarStar,
  ATildeUnary,
  KAs,
  KAssert,
  KBreak,
  KConst,
  KContinue,
  KData,
  KElse,
  KEnum,
  KExpose,
  KFalse,
  KFn,
  KFor,
  KIf,
  KIn,
  KLet,
  KLocal,
  KMatch,
  KReturn,
  KRule,
  KSource,
  KStruct,
  KTrue,
  KType,
  KUsage,
  KUse,
  OAmp,
  OAmpAmp,
  OArrowMap,
  OArrowRet,
  OAt,
  OBackslash,
  OBangUnary,
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
  OMinusUnary,
  ONe,
  OPercent,
  OPlus,
  OSemi,
  OSlash,
  OStar,
  OStarStar,
  OTildeUnary,
  OVERLOADABLE,
  TBuiltin,
  TComment,
  TDeriv,
  TDerivIgnore,
  TFloat,
  TIdent,
  TIgnore,
  TInt,
  TLabel,
  TParam,
  TSource,
  TString,
  TSym,
  type Brack,
} from "./kind"
import { ExposeFn, ExposeLet, ExposeType } from "./node/expose"
import {
  ExprArray,
  ExprArrayByRepetition,
  ExprBinary,
  ExprBlock,
  ExprCall,
  ExprCast,
  ExprDeriv,
  ExprEmpty,
  ExprExit,
  ExprFor,
  ExprIf,
  ExprIndex,
  ExprLit,
  ExprMatch,
  ExprParen,
  ExprProp,
  ExprRange,
  ExprStruct,
  ExprSymStruct,
  ExprUnary,
  ExprVar,
  ExprVarParam,
  Source,
  SourceInterp,
  SourceSingle,
  type NodeExpr,
  type ExprBinaryOp,
} from "./node/expr"
import {
  AssertionMessage,
  Bracketed,
  Comments,
  Else,
  EnumMapVariant,
  EnumVariant,
  ExposeAliases,
  ExprLabel,
  FnParam,
  FnReturnType,
  FnUsage,
  GenericParam,
  GenericParams,
  Initializer,
  List,
  MatchArm,
  ParamType,
  PlainList,
  PrescribedType,
  Prop,
  Rule,
  Script,
  StructArg,
  StructFieldDecl,
  StructPatProp,
  StructPatPropPat,
  VarWithout,
} from "./node/extra"
import {
  ItemAssert,
  ItemComment,
  ItemData,
  ItemEnum,
  ItemEnumMap,
  ItemExpose,
  ItemFn,
  ItemRule,
  ItemStruct,
  ItemType,
  ItemUse,
  type NodeItem,
} from "./node/item"
import type { Ident, IdentFnName } from "./node/node"
import { PatIgnore, PatLit, PatStruct, PatVar, type NodePat } from "./node/pat"
import {
  StmtAssert,
  StmtComment,
  StmtExpr,
  StmtLet,
  type NodeStmt,
} from "./node/stmt"
import {
  TypeArray,
  TypeBlock,
  TypeEmpty,
  TypeLit,
  TypeParen,
  TypeVar,
  type NodeType,
} from "./node/type"
import { Stream } from "./stream"
import { Token } from "./token"

function patStructProp(stream: Stream) {
  const key = stream.match(TIdent)
  if (!key) return null

  const colon = stream.match(OColon)

  return new StructPatProp(
    key,
    colon && new StructPatPropPat(colon, pat(stream)),
  )
}

const patStructBody = createCommaOp(
  OLBrace,
  patStructProp,
  Code.ExpectedDestructuring,
)

function patAtom(stream: Stream) {
  switch (stream.peek()) {
    case TIgnore:
      return new PatIgnore(stream.match(TIgnore)!)

    case TIdent:
      const id = stream.match(TIdent)!
      if (stream.peek() == OLBrace) {
        stream.raiseNext(Code.UseDotAsAStructNameForDestructuringInPatterns)
      }
      return new PatVar(id)

    case ODot: {
      const name = stream.match(ODot)!
      const of = patStructBody(stream)
      return new PatStruct(name, of)
    }

    case TSym: {
      const name = stream.match(TSym)!
      if (stream.peek() == OLBrace) {
        const of = patStructBody(stream)
        return new PatStruct(name, of)
      } else {
        return new PatLit(name)
      }
    }

    case TInt:
    case TFloat:
    case KTrue:
    case KFalse:
      return new PatLit(stream.matchAny([TInt, TFloat, KTrue, KFalse])!)
  }

  stream.raiseNext(Code.ExpectedPat)
  return new PatIgnore(
    new Token(stream.source, TIgnore, stream.loc(), stream.loc(), true),
  )
}

function pat(stream: Stream): NodePat {
  return patAtom(stream)
}

function genericParam(stream: Stream) {
  const ident = stream.match(TIdent)
  if (!ident) return null

  const colon = stream.match(OColon)
  const ty = colon && type(stream)

  return new GenericParam(ident, colon && new ParamType(colon, ty))
}

const genericParamsRaw = createCommaOp(OLAngle, genericParam, null)

function genericParams(stream: Stream) {
  const raw = genericParamsRaw(stream)
  if (raw) return new GenericParams(raw)
  return null
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

function type(stream: Stream): NodeType {
  switch (stream.peek()) {
    case TIdent:
      return new TypeVar(stream.match(TIdent)!, typeArgs(stream))

    case TInt:
    case TFloat:
    case TSym:
    case KTrue:
    case KFalse:
      // TODO: maybe enums with data can be supported directly
      return new TypeLit(stream.matchAny([TInt, TFloat, TSym, KTrue, KFalse])!)

    case OLBrace:
      return new TypeBlock(block(stream, null)!)

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

function exprLit(stream: Stream, ctx: ExprContext) {
  const token =
    stream.match(TSym) || stream.matchAny([TFloat, TInt, KFalse, KTrue])
  if (!token) return null

  if (token.kind == TSym && ctx.struct && stream.peek() == OLBrace) {
    const struct = structArgs(stream)
    if (struct) {
      return new ExprSymStruct(token, struct)
    }
  }

  return new ExprLit(token)
}

interface ExprContext {
  struct: boolean
  noErrorOnEmpty?: boolean
}

function exprVarParam(stream: Stream) {
  const token = stream.match(TParam)
  if (!token) return null

  const wo = varWithout(stream)
  const dc = stream.match(OColonColon)
  const ty = dc && type(stream)

  if (stream.peek() == OLAngle || stream.peek() == OLParen) {
    stream.raiseNext(Code.VarParamFollowedByArguments)
  }

  return new ExprVarParam(token, wo, dc && new PrescribedType(dc, ty, false))
}

function exprVar(stream: Stream, ctx: ExprContext) {
  const token = stream.match(TIdent) || stream.match(TBuiltin)
  if (!token) return null

  const struct = ctx.struct && structArgs(stream)
  if (struct) {
    return new ExprStruct(token, struct)
  }

  if (stream.peek() == OBangUnary)
    stream.raiseNext(Code.NonParamFollowedByConstMarker)

  if (stream.peek() == OColonColon)
    stream.raiseNext(Code.NonParamFollowedByTypeAssertion)

  return new ExprVar(token, typeArgs(stream), callArgs(stream))
}

export function exprIf(stream: Stream): ExprIf | null {
  const kwIf = stream.match(KIf)
  if (!kwIf) return null

  const condition = expr(stream, { struct: false })
  const blockIf = block(stream, null)

  const kwElse = stream.match(KElse)
  if (!kwElse) {
    return new ExprIf(kwIf, condition, blockIf, null)
  }

  if (stream.peek() == KIf) {
    return new ExprIf(
      kwIf,
      condition,
      blockIf,
      new Else(kwElse, exprIf(stream)),
    )
  } else if (stream.peek() == OLBrace) {
    return new ExprIf(
      kwIf,
      condition,
      blockIf,
      new Else(kwElse, block(stream, null)),
    )
  } else {
    stream.raiseNext(Code.IfOrBlockMustFollowElse)
    return new ExprIf(kwIf, condition, blockIf, null)
  }
}

const forBindings = createUnbracketedCommaOp(
  (stream) => stream.match(TIdent),
  Code.ExpectedForBindings,
)
const forSources = createUnbracketedCommaOp(
  (stream) =>
    stream.peek() == OLBrace ? null : expr(stream, { struct: false }),
  Code.ExpectedForSources,
)

export function exprFor(
  stream: Stream,
  label: ExprLabel | null,
): ExprFor | null {
  const kw = stream.match(KFor)
  if (!kw) return null

  return new ExprFor(
    label,
    kw,
    forBindings(stream),
    stream.matchOr(KIn, Code.ExpectedIn),
    forSources(stream),
    block(stream, null),
  )
}

export function exprLabeled(
  stream: Stream,
): [NodeExpr, needsSemi: boolean] | null {
  const labelIdent = stream.match(TLabel)
  if (!labelIdent) return null

  const colon = stream.matchOr(OColon, Code.ExpectedColon)
  const label = new ExprLabel(labelIdent, colon)

  switch (stream.peek()) {
    case KFor:
      return [exprFor(stream, label)!, false]

    case OLBrace:
      return [block(stream, label)!, false]
  }

  stream.raise(
    Code.InvalidLabel,
    new Pos(labelIdent.start, (colon ?? labelIdent).end),
  )
  return [expr(stream), true]
}

export function exprExit(stream: Stream, ctx: ExprContext): ExprExit | null {
  const kw = stream.matchAny([KReturn, KBreak, KContinue])
  if (!kw) return null

  const label = stream.match(TLabel)
  let value: NodeExpr | null = expr(stream, {
    struct: ctx.struct,
    noErrorOnEmpty: true,
  })
  if (value instanceof ExprEmpty) value = null

  if (kw.kind == KReturn) {
    if (label) {
      stream.raise(Code.InvalidLabeledExit, label)
    }
  } else if (kw.kind == KContinue) {
    if (value) {
      stream.raise(Code.InvalidValuedExit, value)
    }
  }

  return new ExprExit(kw, label, value)
}

function matchArm(stream: Stream) {
  return new MatchArm(
    pat(stream),
    stream.matchOr(OArrowMap, Code.ExpectedMatchArrow),
    expr(stream),
  )
}

const arms = createCommaOp(OLBrace, matchArm, Code.ExpectedMatchArms)

function exprMatch(stream: Stream) {
  const kw = stream.match(KMatch)
  if (!kw) return null

  return new ExprMatch(kw, expr(stream, { struct: false }), arms(stream))
}

function exprAtom(stream: Stream, ctx: ExprContext): NodeExpr {
  switch (stream.peek()) {
    case ODot:
      return new ExprStruct(stream.match(ODot)!, structArgs(stream))

    case TFloat:
    case TInt:
    case TSym:
    case KTrue:
    case KFalse:
      return exprLit(stream, ctx)!

    case TParam:
      return exprVarParam(stream)!

    case TIdent:
    case TBuiltin:
      return exprVar(stream, ctx)!

    case OLParen: {
      const token = stream.matchGroup(OLParen)!
      return new ExprParen(new Bracketed(token, token.contents.full(expr)))
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
          return new ExprArray(new List(lt, items, null, true, false))

        case null:
          return new ExprArray(new List(lt, [first], null, true, false))
      }

      lt.contents.raiseNext(Code.ExpectedCommaOrSemi)
      return new ExprArray(new List(lt, [first], null, true, false))
    }

    case OLBrace:
      return block(stream, null)!

    case KIf:
      return exprIf(stream)!

    case KFor:
      return exprFor(stream, null)!

    case KSource:
      return source(stream, false)!

    case KReturn:
    case KBreak:
    case KContinue:
      return exprExit(stream, ctx)!

    case KMatch:
      return exprMatch(stream)!

    case TLabel:
      return exprLabeled(stream)![0]
  }

  if (!ctx.noErrorOnEmpty) {
    stream.raise(Code.ExpectedExpression, stream.pos())
  }
  return new ExprEmpty(stream.loc())
}

function prop(stream: Stream) {
  const dot = stream.match(ODot)
  if (!dot) return null

  const ident = stream.matchOr(TIdent, Code.ExpectedIdent)
  return new Prop(dot, ident)
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
        exp = new ExprIndex(exp, new Bracketed(n, n.contents.full(expr)))
        continue

      case ODot:
        exp = new ExprProp(
          exp,
          prop(stream)!,
          typeArgs(stream),
          callArgs(stream),
        )
        continue
    }

    break
  }

  return exp
}

function exprUnary(stream: Stream, ctx: ExprContext): NodeExpr {
  let ops = []
  let match
  while (
    (match =
      stream.matchAny([
        OMinus,
        AMinus,
        OTildeUnary,
        ATildeUnary,
        OBangUnary,
        ABangUnary,
      ]) || stream.matchAny([TDeriv, TDerivIgnore]))
  ) {
    ops.push(match)
  }

  let expr = exprPropChain(stream, ctx)
  while (ops[0]) {
    const a = ops.pop()!
    if (a.kind == TDeriv || a.kind == TDerivIgnore) {
      expr = new ExprDeriv(a, expr)
    } else {
      // makes precedence rules easier to manage
      if (a.kind == OMinus) {
        ;(a as any).kind = OMinusUnary
      } else if (a.kind == AMinus) {
        ;(a as any).kind = AMinusUnary
      }

      expr = new ExprUnary(a as Token<any>, expr)
    }
  }
  return expr
}

function createBinOp1(
  permitted: ExprBinaryOp[],
  side: (stream: Stream, ctx: ExprContext) => NodeExpr,
) {
  return (stream: Stream, ctx: ExprContext): NodeExpr => {
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
  side: (stream: Stream, ctx: ExprContext) => NodeExpr,
) {
  return (stream: Stream, ctx: ExprContext): NodeExpr => {
    let expr = side(stream, ctx)
    let op
    while ((op = stream.matchAny(permitted))) {
      expr = new ExprBinary(expr, op, side(stream, ctx))
    }
    return expr
  }
}

function createBinOpArrowRet(
  side: (stream: Stream, ctx: ExprContext) => NodeExpr,
) {
  return (stream: Stream, ctx: ExprContext): NodeExpr => {
    let expr = side(stream, ctx)
    let op
    while ((op = stream.match(OArrowRet))) {
      expr = new ExprCast(expr, op, type(stream))
    }
    return expr
  }
}

function createRangeOp(side: (stream: Stream, ctx: ExprContext) => NodeExpr) {
  return (stream: Stream, ctx: ExprContext): NodeExpr => {
    if (stream.peek() == ODotDot) {
      const dot = stream.match(ODotDot)!
      const rhs = side(stream, { struct: ctx.struct, noErrorOnEmpty: true })
      if (rhs instanceof ExprEmpty) {
        return new ExprRange(null, dot, null)
      } else {
        return new ExprRange(null, dot, rhs)
      }
    }

    const lhs = side(stream, ctx)
    const dot = stream.match(ODotDot)
    if (!dot) return lhs
    const rhs = side(stream, { struct: ctx.struct, noErrorOnEmpty: true })
    if (rhs instanceof ExprEmpty) {
      return new ExprRange(lhs, dot, null)
    } else {
      return new ExprRange(lhs, dot, rhs)
    }
  }
}

function createBinOpR(
  permitted: ExprBinaryOp[],
  side: (stream: Stream, ctx: ExprContext) => NodeExpr,
) {
  return (stream: Stream, ctx: ExprContext): NodeExpr => {
    let rhs = side(stream, ctx)
    let op
    let parts = []
    while ((op = stream.matchAny(permitted))) {
      parts.push({ lhs: rhs, op })
      rhs = side(stream, ctx)
    }
    while (parts.length) {
      const { lhs, op } = parts.pop()!
      rhs = new ExprBinary(lhs, op, rhs)
    }
    return rhs
  }
}

const exprBinaryOp = createBinOpR(
  [OEq, AEq],
  createBinOpL(
    [OAt, AAt],
    createBinOpL(
      [OBarBar, ABarBar],
      createBinOpL(
        [OAmpAmp, AAmpAmp],
        createBinOp1(
          [OEqEq, ONe, OLt, OGt, OLe, OGe, AEqEq, ANe, ALt, AGt, ALe, AGe],
          createBinOpArrowRet(
            createBinOpL(
              [OBar, ABar],
              createBinOpL(
                [OAmp, AAmp],
                createBinOpL(
                  [OPlus, OMinus, APlus, AMinus],
                  createBinOpL(
                    [OStar, OSlash, OPercent, AStar, ASlash, APercent],
                    createBinOpR(
                      [OStarStar, AStarStar],
                      createRangeOp(
                        createBinOp1(
                          [OBackslash, ABackslash], // exact fraction operator
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
      ),
    ),
  ),
)

function stmtAssert(stream: Stream) {
  const kw = stream.match(KAssert)
  if (!kw) return null

  const e = expr(stream)
  const kw2 = stream.match(KElse)

  return new StmtAssert(
    kw,
    e,
    kw2 &&
      new AssertionMessage(
        kw2,
        stream.matchOr(TString, Code.ExpectedAssertFailureReason),
      ),
    stream.matchOr(OSemi, Code.MissingSemi),
  )
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

  return new StmtLet(
    kw,
    ident,
    colon && new ParamType(colon, ty),
    eq && new Initializer(eq, value!),
    semi,
  )
}

function stmt(stream: Stream): NodeStmt | null {
  if (stream.isDone()) {
    return null
  }

  switch (stream.peek()) {
    case TComment:
      return new StmtComment(comments(stream))

    case KLet:
      return stmtLet(stream)!

    case KIf:
      return new StmtExpr(exprIf(stream)!, stream.match(OSemi), false)

    case KFor:
      return new StmtExpr(exprFor(stream, null)!, stream.match(OSemi), false)

    case KMatch:
      return new StmtExpr(exprMatch(stream)!, stream.match(OSemi), false)

    case OLBrace:
      return new StmtExpr(block(stream, null)!, stream.match(OSemi), false)

    case TLabel: {
      const [expr, needsSemi] = exprLabeled(stream)!
      const semi = stream.match(OSemi)
      return new StmtExpr(expr, semi, needsSemi && !semi)
    }

    case KAssert:
      return stmtAssert(stream)!

    default:
      const e = expr(stream)
      const semi = stream.match(OSemi)
      return new StmtExpr(e, semi, !semi)
  }
}

function expr(stream: Stream, ctx: ExprContext = { struct: true }) {
  return exprBinaryOp(stream, ctx)
}

function createUnbracketedCommaOp<T extends NodeExpr | Ident>(
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
        if (stream.isDone()) {
          break
        }
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

function createCommaOp<T, U extends { end: number } | null = null>(
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

    const list = new List<T, U | null>(group, [], null, true, false)
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

function structArg(stream: Stream) {
  const ident = stream.match(TIdent)
  if (!ident) return null

  const colon = stream.match(OColon)
  const e = colon && expr(stream)

  return new StructArg(ident, colon, e)
}

const callArgs = createCommaOp(OLParen, expr, null)
const structArgs = createCommaOp(OLBrace, structArg, null)

function block(
  stream: Stream,
  label: ExprLabel | null,
  forceMultiline = false,
) {
  const group = stream.matchGroup(OLBrace)
  if (!group) {
    stream.raiseNext(Code.ExpectedBlock)
    return null
  }

  const list: NodeStmt[] = []
  let a
  while (group.contents.match(OSemi));
  while ((a = stmt(group.contents))) {
    while (group.contents.match(OSemi));
    list.push(a)
    if (a instanceof StmtExpr && a.terminatesBlock) {
      break
    }
  }
  group.contents.requireDone()

  return new ExprBlock(
    label,
    new List(group, list, null, false, forceMultiline),
  )
}

function createBlockOp<T>(
  take: (stream: Stream) => T | null,
  code: Code | null,
) {
  return (stream: Stream) => {
    const group = stream.matchGroup(OLBrace)
    if (!group) {
      if (code != null) {
        stream.raiseNext(code)
      }
      return null
    }

    const list: T[] = []
    let a
    let last = group.contents.index
    while ((a = take(group.contents))) {
      if (last == group.contents.index) break
      last = group.contents.index
      list.push(a)
      if (group.contents.isDone()) break
    }
    group.contents.requireDone()

    return new List(group, list, null, false, true)
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
      interps.push(new SourceInterp(new Bracketed(m, m.contents.full(expr))))
      const nextSource = brace.contents.match(TSource)
      if (nextSource) {
        parts.push(nextSource)
      } else break contents
    }
    brace.contents.requireDone()
  }

  return new SourceSingle(kw, lang, brace, parts, interps)
}

function source(stream: Stream, block: boolean): Source | null {
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
    colon && new PrescribedType(colon, ty, true),
    block,
  )
}

function itemType(stream: Stream) {
  const kw = stream.match(KType)
  if (!kw) return null

  const ident = stream.match(TIdent)
  const braces = stream.matchGroup(OLBrace)
  const s = braces && braces.contents.full((x) => source(x, true))

  return new ItemType(kw, ident, braces, s)
}

function fnParam(stream: Stream) {
  const ident = stream.match(TIdent)
  if (!ident) return null

  const colon = stream.matchOr(OColon, Code.ExpectedColon)
  return new FnParam(ident, colon, type(stream))
}

const fnParams = createCommaOp(OLParen, fnParam, Code.ExpectedFnParams)

function itemFn(stream: Stream) {
  const kw = stream.match(KFn)
  if (!kw) return null

  const ident = fnName(stream)
  if (!ident) stream.raiseNext(Code.ExpectedFnName)
  const tparams = genericParams(stream)
  const params = fnParams(stream)
  const arrow = stream.match(OArrowRet) // not matchOr since return types are optional (void is implied)
  let ty = null
  if (arrow && stream.peek() == OLBrace) {
    stream.raiseNext(Code.FnReturnTypeMustNotBeBlock)
  } else if (arrow) {
    ty = type(stream)
  }
  const ret = arrow && new FnReturnType(arrow, ty)
  const usageKw = stream.match(KUsage)

  return new ItemFn(
    kw,
    ident,
    tparams,
    params,
    ret,
    usageKw && new FnUsage(usageKw, fnUsageExamples(stream)),
    block(stream, null, true),
  )
}

const fnUsageExamples = createUnbracketedCommaOp(
  (stream) => expr(stream, { struct: false }),
  Code.ExpectedUsageExamples,
)

function rule(stream: Stream) {
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

  return new Rule(lhs, op, rhs, semi)
}

const ruleBlock = createBlockOp(rule, null)

function itemRule(stream: Stream) {
  const kw = stream.match(KRule)
  if (!kw) return null

  const tparams = genericParams(stream)

  return new ItemRule(
    kw,
    tparams,
    stream.peek() == OLBrace ? ruleBlock(stream) : rule(stream),
  )
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

function structField(stream: Stream) {
  const constKw = stream.match(KConst)

  const ident = stream.match(TIdent)
  if (!ident) return null

  return new StructFieldDecl(
    constKw,
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

function itemEnum(stream: Stream) {
  const kw = stream.match(KEnum)
  if (!kw) return null

  const ident = stream.matchOr(TIdent, Code.ExpectedIdent)
  const tparams = genericParams(stream)
  const arrow = stream.match(OArrowRet)

  if (arrow) {
    return new ItemEnumMap(
      kw,
      ident,
      tparams,
      arrow,
      type(stream),
      enumMapVariants(stream),
    )
  } else {
    return new ItemEnum(kw, ident, tparams, enumVariants(stream))
  }
}

function itemStruct(stream: Stream) {
  const kw = stream.match(KStruct)
  if (!kw) return null

  const ident = stream.matchOr(TIdent, Code.ExpectedIdent)
  const generics = genericParams(stream)

  return new ItemStruct(kw, ident, generics, structFields(stream))
}

function itemData(stream: Stream) {
  const kw = stream.match(KData)
  if (!kw) return null

  return new ItemData(
    kw,
    stream.match(KLocal),
    stream.matchOr(TIdent, Code.ExpectedIdent),
    stream.matchOr(OColon, Code.ExpectedColon),
    type(stream),
    stream.matchOr(OSemi, Code.MissingSemi),
  )
}

function itemTest(stream: Stream) {
  const kw = stream.match(KAssert)
  if (!kw) return null

  const e = expr(stream)
  const kw2 = stream.match(KElse)

  return new ItemAssert(
    kw,
    e,
    kw2 &&
      new AssertionMessage(
        kw2,
        stream.matchOr(TString, Code.ExpectedAssertFailureReason),
      ),
    stream.matchOr(OSemi, Code.MissingSemi),
  )
}

function fnName(stream: Stream): IdentFnName | null {
  return stream.match(TIdent) || stream.matchAny(OVERLOADABLE)
}

const aliasList = createCommaOp(OLBrace, fnName, null)

function exposeAliases(stream: Stream) {
  const as = stream.match(KAs)
  if (!as) return null

  const aliases = stream.peek() == OLBrace ? aliasList(stream) : fnName(stream)
  return new ExposeAliases(as, aliases)
}

function expose(stream: Stream) {
  const kw = stream.match(KFn) || stream.match(KType) || stream.match(KLet)
  if (!kw) {
    stream.raiseNext(Code.InvalidExposeKind)
    return null
  }

  if (kw.kind == KLet) {
    const name = stream.match(TIdent)
    if (!name) stream.raiseNext(Code.ExpectedIdent)
    const as = exposeAliases(stream)
    const label = stream.matchOr(TString, Code.ExpectedExposeString)
    const colon = stream.match(OColon)
    const ty = colon && type(stream)
    const eq = stream.match(OEq)
    const value = expr(stream)
    const semi = stream.matchOr(OSemi, Code.MissingSemi)

    return new ExposeLet(
      kw,
      name,
      as,
      label,
      colon && new ParamType(colon, ty),
      eq,
      value,
      semi,
    )
  }

  const name = fnName(stream)
  if (!name) stream.raiseNext(Code.ExpectedFnName)
  if (kw.kind == KFn && stream.peek() == OLAngle) {
    stream.raiseNext(Code.NoGenericsOnExposedFn)
  }

  const targs = typeArgs(stream)
  const as = exposeAliases(stream)
  const label = stream.matchOr(TString, Code.ExpectedExposeString)
  const semi = stream.matchOr(OSemi, Code.MissingSemi)

  return kw.kind == KType ?
      new ExposeType(kw, name, targs, as, label, semi)
    : new ExposeFn(kw, name, label, as, semi)
}

const exposeList = createBlockOp(expose, null)

function itemExpose(stream: Stream) {
  const kw = stream.match(KExpose)
  if (!kw) return null

  return new ItemExpose(
    kw,
    stream.peek() == OLBrace ? exposeList(stream) : expose(stream),
  )
}

function comments(stream: Stream) {
  let c = []
  let a
  while ((a = stream.match(TComment))) {
    c.push(a)
  }
  if (c.length == 0) {
    throw new Error("Expected at least one comment.")
  }
  return new Comments(c)
}

function item(stream: Stream): NodeItem | null {
  switch (stream.peek()) {
    case TComment:
      return new ItemComment(comments(stream))

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

    case KExpose:
      return itemExpose(stream) // no ! because this returns null if not expose fn or expose type

    case KData:
      return itemData(stream)!

    case KAssert:
      return itemTest(stream)!
  }

  return null
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

const varWithoutList = createCommaOp(
  OLBrack,
  (s) => s.match(TIdent),
  Code.ExpectedConstWrtList,
)

function varWithout(stream: Stream): VarWithout | null {
  const bang = stream.match(OBangUnary)
  if (!bang) return null

  return new VarWithout(bang, stream.match(TIdent) ?? varWithoutList(stream))
}

export function parse(stream: Stream) {
  return script(stream)
}

// TODO: opaque
