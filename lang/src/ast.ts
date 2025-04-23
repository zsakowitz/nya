import type { Ident } from "./ast-old"
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
  KElse,
  KFn,
  KFor,
  KIf,
  KIn,
  KSource,
  KType,
  OAmp,
  OAmpAmp,
  OArrowRet,
  OAt,
  OBackslash,
  OBang,
  OBar,
  OBarBar,
  OColonColon,
  OComma,
  ODot,
  ODotDot,
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
  TBuiltin,
  TFloat,
  TIdent,
  TInt,
  TSource,
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

export abstract class Type extends Node {
  declare private __brand_type
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
  }

  stream.issueOnNext(Code.ExpectedType)
  return new TypeEmpty(stream.loc())
}

const typeArgs = createCommaOp(OLAngle, type)

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
    stream.issueOnNext(Code.IfOrBlockMustFollowElse)
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

const forBindings = createUnbracketedCommaOp((stream) => stream.match(TIdent))
const forSources = createUnbracketedCommaOp((stream) =>
  expr(stream, { struct: false }),
)

export function exprFor(stream: Stream): ExprFor | null {
  const kw = stream.match(KFor)
  if (!kw) return null

  return new ExprFor(
    kw,
    forBindings(stream),
    stream.match(KIn),
    forSources(stream),
    block(stream),
  )
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
      return new ExprParen(token, token.contents.full(expr))
    }

    case OLBrack: {
      const e = listValues(stream)!
      return new ExprArray(e)
    }

    case OLBrace:
      return block(stream)!

    case KIf:
      return exprIf(stream)!

    case KFor:
      return exprFor(stream)!

    case KSource:
      return source(stream)!
  }

  stream.issue(Code.ExpectedExpression, stream.loc(), stream.loc())
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
          stream.match(TIdent),
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

function stmt(stream: Stream): Stmt | null {
  if (stream.isDone()) {
    return null
  }

  switch (stream.peek()) {
    case KIf:
      return new StmtExpr(exprIf(stream)!, stream.match(OSemi), false)
    case KFor:
      return new StmtExpr(exprFor(stream)!, stream.match(OSemi), false)
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
    }

    return list
  }
}

export class List<T extends Print> extends Node {
  constructor(
    readonly bracket: TokenGroup,
    readonly items: T[],
  ) {
    super(bracket.start, bracket.end)
  }
}

function createCommaOp<T extends Print>(
  bracket: Brack,
  fn: (stream: Stream) => T | null,
) {
  return (stream: Stream) => {
    const group = stream.matchGroup(bracket)
    if (!group) return null

    const list = new List<T>(group, [])
    if (!group.contents.isEmpty()) {
      const first = fn(group.contents)
      if (!first) {
        group.contents.requireDone()
        return list
      }
      list.items.push(first)

      while (group.contents.match(OComma)) {
        const val = fn(group.contents)
        if (!val) {
          group.contents.requireDone()
          return list
        }
        list.items.push(val)
      }

      group.contents.match(OComma)
      group.contents.requireDone()
    }

    return list
  }
}

const callArgs = createCommaOp(OLParen, expr)
const structArgs = createCommaOp(OLBrace, expr)
const listValues = createCommaOp(OLBrack, expr)

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
  if (!group) return null

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

export class ItemFn extends Item {
  constructor(
    readonly kw: Token<typeof KFn>,
    readonly name: Ident | null,
    readonly params: List<Ident> | null,
    // readonly arrow: Token<typeof OArrowRet> | null,
    // readonly retType:
    readonly block: ExprBlock | null,
  ) {
    super(kw.start, (block ?? params ?? name ?? kw).end)
  }
}

const fnParams = createCommaOp(OLParen, (s) => s.match(TIdent))

function itemFn(stream: Stream) {
  const kw = stream.match(KFn)
  if (!kw) return null

  return new ItemFn(kw, stream.match(TIdent), fnParams(stream), block(stream))
}

function item(stream: Stream): Item | null {
  switch (stream.peek()) {
    case KType:
      return itemType(stream)!

    case KFn:
      return itemFn(stream)!
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
