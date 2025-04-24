import {
  AAmp,
  AAmpAmp,
  ABackslash,
  ABang,
  ABar,
  ABarBar,
  AEq,
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
  KAs,
  KAssert,
  KBreak,
  KConst,
  KContinue,
  KData,
  KElse,
  KEnum,
  KExpose,
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
} from "./kind"
import {
  EnumMapVariant,
  EnumVariant,
  ExposeAliases,
  Expr,
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
  ExprLabel,
  ExprLit,
  ExprMatch,
  ExprParen,
  ExprProp,
  ExprRange,
  ExprStruct,
  ExprSymStruct,
  ExprUnary,
  ExprVar,
  FnParam,
  GenericParam,
  GenericParams,
  Item,
  ItemData,
  ItemEnum,
  ItemEnumMap,
  ItemExposeFn,
  ItemExposeType,
  ItemFn,
  ItemRule,
  ItemStruct,
  ItemTest,
  ItemType,
  ItemUse,
  List,
  MatchArm,
  Pat,
  PatEmpty,
  PatIgnore,
  PatLit,
  PatVar,
  PlainList,
  Prop,
  Script,
  Source,
  SourceInterp,
  SourceSingle,
  Stmt,
  StmtAssert,
  StmtExpr,
  StmtLet,
  StructArg,
  StructFieldDecl,
  Type,
  TypeArray,
  TypeBlock,
  TypeEmpty,
  TypeLit,
  TypeParen,
  TypeVar,
  type ExprBinaryOp,
  type IdentFnName,
} from "./nodes"
import type { Print } from "./print"
import { Stream } from "./stream"
import { Code } from "./token"

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

function genericParam(stream: Stream) {
  const ident = stream.match(TIdent)
  if (!ident) return null

  const colon = stream.match(OColon)
  const ty = colon && type(stream)

  return new GenericParam(ident, colon, ty)
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

function type(stream: Stream): Type {
  switch (stream.peek()) {
    case TIdent:
      return new TypeVar(stream.match(TIdent)!, typeArgs(stream))

    case TInt:
    case TFloat:
    case TSym:
      return new TypeLit(stream.matchAny([TInt, TFloat, TSym])!)

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
  const token = stream.match(TFloat) || stream.match(TInt) || stream.match(TSym)
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

export function exprIf(stream: Stream): ExprIf | null {
  const kwIf = stream.match(KIf)
  if (!kwIf) return null

  const condition = expr(stream, { struct: false })
  const blockIf = block(stream, null)

  const kwElse = stream.match(KElse)
  if (!kwElse) {
    return new ExprIf(kwIf, condition, blockIf, null, null)
  }

  if (stream.peek() == KIf) {
    return new ExprIf(kwIf, condition, blockIf, kwElse, exprIf(stream))
  } else if (stream.peek() == OLBrace) {
    return new ExprIf(kwIf, condition, blockIf, kwElse, block(stream, null))
  } else {
    stream.raiseNext(Code.IfOrBlockMustFollowElse)
    return new ExprIf(kwIf, condition, blockIf, null, null)
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

export function exprLabeled(stream: Stream): [Expr, needsSemi: boolean] | null {
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

  stream.raise(Code.InvalidLabel, labelIdent.start, (colon ?? labelIdent).end)
  return [expr(stream), true]
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

function exprAtom(stream: Stream, ctx: ExprContext): Expr {
  switch (stream.peek()) {
    case ODot:
      return new ExprStruct(stream.match(ODot)!, structArgs(stream))

    case TFloat:
    case TInt:
    case TSym:
      return exprLit(stream, ctx)!

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
      return block(stream, null)!

    case KIf:
      return exprIf(stream)!

    case KFor:
      return exprFor(stream, null)!

    case KSource:
      return source(stream)!

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
    stream.raise(Code.ExpectedExpression, stream.loc(), stream.loc())
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
        exp = new ExprIndex(exp, n, n.contents.full(expr))
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

function createBinOpArrowRet(side: (stream: Stream, ctx: ExprContext) => Expr) {
  return (stream: Stream, ctx: ExprContext): Expr => {
    let expr = side(stream, ctx)
    let op
    while ((op = stream.match(OArrowRet))) {
      expr = new ExprCast(expr, op, type(stream))
    }
    return expr
  }
}

function createRangeOp(side: (stream: Stream, ctx: ExprContext) => Expr) {
  return (stream: Stream, ctx: ExprContext): Expr => {
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
  side: (stream: Stream, ctx: ExprContext) => Expr,
) {
  return (stream: Stream, ctx: ExprContext): Expr => {
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
                [OPlus, OMinus, OPercent, APlus, AMinus, APercent],
                createBinOpL(
                  [OStar, OSlash, AStar, ASlash],
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
)

function stmtAssert(stream: Stream) {
  const kw = stream.match(KAssert)
  if (!kw) return null

  const e = expr(stream)
  const kw2 = stream.match(KElse)
  const msg = kw2 && stream.matchOr(TString, Code.ExpectedAssertFailureReason)

  return new StmtAssert(
    kw,
    e,
    kw2,
    msg,
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

function structArg(stream: Stream) {
  const ident = stream.match(TIdent)
  if (!ident) return null

  const colon = stream.match(OColon)
  const e = colon && expr(stream)

  return new StructArg(ident, colon, e)
}

const callArgs = createCommaOp(OLParen, expr, null)
const structArgs = createCommaOp(OLBrace, structArg, null)

function block(stream: Stream, label: ExprLabel | null) {
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

  return new ExprBlock(label, group, list)
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

function itemType(stream: Stream) {
  const kw = stream.match(KType)
  if (!kw) return null

  const ident = stream.match(TIdent)
  const braces = stream.matchGroup(OLBrace)
  const s = braces && braces.contents.full(source)

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
    stream.raiseNext(Code.ExpectedType)
  } else if (arrow) {
    ty = type(stream)
  }
  const usageKw = stream.match(KUsage)
  const usages = usageKw && fnUsageExamples(stream)

  return new ItemFn(
    kw,
    ident,
    tparams,
    params,
    arrow,
    ty,
    usageKw,
    usages,
    block(stream, null),
  )
}

const fnUsageExamples = createUnbracketedCommaOp(
  (stream) => expr(stream, { struct: false }),
  Code.ExpectedForBindings,
)

function itemRule(stream: Stream) {
  const kw = stream.match(KRule)
  if (!kw) return null

  const tparams = genericParams(stream)
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

  return new ItemRule(kw, tparams, lhs, op, rhs, semi)
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
  const msg = kw2 && stream.matchOr(TString, Code.ExpectedAssertFailureReason)

  return new ItemTest(kw, e, kw2, msg, stream.matchOr(OSemi, Code.MissingSemi))
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

export function itemExpose(stream: Stream) {
  const kw1 = stream.match(KExpose)
  if (!kw1) return null

  const kw2 = stream.match(KFn) || stream.match(KType)
  if (!kw2) {
    stream.raiseNext(Code.MustExposeFnOrType)
    return null
  }

  const name = fnName(stream)
  if (!name) stream.raiseNext(Code.ExpectedFnName)
  if (kw2.kind == KFn && stream.peek() == OLAngle) {
    stream.raiseNext(Code.NoGenericsOnExposedFn)
  }

  const targs = typeArgs(stream)
  const label = stream.matchOr(TString, Code.ExpectedExposeString)
  const as = exposeAliases(stream)
  const semi = stream.matchOr(OSemi, Code.MissingSemi)

  return kw2.kind == KType ?
      new ItemExposeType(kw1, kw2, name, targs, label, as, semi)
    : new ItemExposeFn(kw1, kw2, name, label, as, semi)
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

export function parse(stream: Stream) {
  return script(stream)
}

// TODO: opaque
