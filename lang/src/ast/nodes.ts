import {
  AAmp,
  AAmpAmp,
  type AAt,
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
  type KConst,
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
  type OAt,
  OBackslash,
  OBang,
  OBar,
  OBarBar,
  OColon,
  OColonColon,
  ODot,
  ODotDot,
  OEq,
  OEqEq,
  OGe,
  OGt,
  OLBrace,
  OLBrack,
  OLe,
  OLInterp,
  OLParen,
  OLt,
  OMinus,
  ONe,
  type OOverloadable,
  OPercent,
  OPlus,
  OSemi,
  OSlash,
  OStar,
  OStarStar,
  OTilde,
  type TAliasOnly,
  TBuiltin,
  TDeriv,
  TDerivIgnore,
  TFloat,
  TIdent,
  TIgnore,
  TInt,
  TLabel,
  type TProp,
  TSource,
  TString,
  TSym,
} from "./kind"
import type { Print } from "./print"
import type { TokenGroup } from "./stream"
import type { Token } from "./token"

export type Ident = Token<typeof TIdent>

export type IdentFnName = Token<
  typeof TIdent | typeof TAliasOnly | typeof TProp | OOverloadable
>

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

export abstract class Pat extends Node {
  declare private __brand_pat
}

export abstract class Stmt extends Node {
  declare private __brand_stmt
}

export abstract class Item extends Node {
  declare private __brand_item
}

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

export class GenericParam extends Node {
  constructor(
    readonly name: Ident,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type | null,
  ) {
    super(name.start, (type ?? colon ?? name).end)
  }
}

export class GenericParams extends Node {
  constructor(readonly list: List<GenericParam>) {
    super(list.start, list.end)
  }
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

export class ExprLit extends Expr {
  constructor(
    readonly value: Token<typeof TFloat | typeof TInt | typeof TSym>,
  ) {
    super(value.start, value.end)
  }
}

export class ExprVar extends Expr {
  constructor(
    readonly name: Token<typeof TIdent | typeof TBuiltin | typeof TProp>,
    readonly targs: List<Type> | null,
    readonly args: List<Expr> | null,
  ) {
    super(name.start, name.end)
  }
}

export class ExprStruct extends Expr {
  constructor(
    readonly name: Token<
      typeof TIdent | typeof TBuiltin | typeof ODot | typeof TProp
    >,
    readonly args: List<Expr> | null,
  ) {
    super(name.start, (args ?? name).end)
  }
}

export class ExprSymStruct extends Expr {
  constructor(
    readonly name: Token<typeof TSym>,
    readonly args: List<Expr> | null,
  ) {
    super(name.start, (args ?? name).end)
  }
}

export class ExprEmpty extends Expr {
  constructor(readonly at: number) {
    super(at, at)
  }
}

export class ExprLabel extends Node {
  constructor(
    readonly label: Token<typeof TLabel>,
    readonly colon: Token<typeof OColon> | null,
  ) {
    super(label.start, (colon ?? label).end)
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

export class ExprFor extends Expr {
  constructor(
    readonly label: ExprLabel | null,
    readonly kw: Token<typeof KFor>,
    readonly bound: PlainList<Ident>,
    readonly eq: Token<typeof KIn> | null,
    readonly sources: PlainList<Expr>,
    readonly block: ExprBlock | null,
  ) {
    super((label ?? kw).start, (block ?? sources).end)
  }
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

export class MatchArm extends Node {
  constructor(
    readonly pat: Pat,
    readonly arrow: Token<typeof OArrowMap> | null,
    readonly expr: Expr,
  ) {
    super(pat.start, expr.end)
  }
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

export class ExprCall extends Expr {
  constructor(
    readonly on: Expr,
    readonly targs: List<Type> | null,
    readonly args: List<Expr> | null,
  ) {
    super(on.start, (args ?? targs ?? on).end)
  }
}

export class Prop extends Node {
  constructor(dot: Token<typeof ODot> | null, name: Token<typeof TIdent> | null)
  constructor(dot: null, name: Token<typeof TProp>)
  constructor(
    readonly dot: Token<typeof ODot> | null,
    readonly name: Token<typeof TIdent | typeof TProp> | null,
  ) {
    super((dot ?? name)!.start, (name ?? dot)!.end)
  }
}

export class ExprProp extends Expr {
  constructor(
    readonly on: Expr,
    readonly prop: Prop,
    readonly targs: List<Type> | null,
    readonly args: List<Expr> | null,
  ) {
    super(on.start, (args ?? targs ?? prop).end)
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

export type ExprUnaryOp =
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

export type ExprBinaryOp =
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
  | typeof OPercent
  | typeof APercent
  | typeof OEq
  | typeof AEq

export class ExprBinary extends Expr {
  constructor(
    readonly lhs: Expr,
    readonly op: Token<ExprBinaryOp>,
    readonly rhs: Expr,
  ) {
    super(lhs.start, rhs.end)
  }
}

export class ExprRange extends Expr {
  constructor(
    readonly lhs: Expr | null,
    readonly op: Token<typeof ODotDot>,
    readonly rhs: Expr | null,
  ) {
    super((lhs ?? op).start, (rhs ?? op).end)
  }
}

export class ExprCast extends Expr {
  constructor(
    readonly lhs: Expr,
    readonly op: Token<typeof OArrowRet>,
    readonly rhs: Type,
  ) {
    super(lhs.start, rhs.end)
  }
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

export class StmtAssert extends Stmt {
  constructor(
    readonly kw: Token<typeof KAssert>,
    readonly expr: Expr,
    readonly elseKw: Token<typeof KElse> | null,
    readonly message: Token<typeof TString> | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? message ?? elseKw ?? expr).end)
  }
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

export class List<T extends Print, U extends Print | null = null> extends Node {
  constructor(
    readonly bracket: TokenGroup,
    readonly items: T[],
    readonly terminator: U,
  ) {
    super(bracket.start, bracket.end)
  }
}

export class ExprBlock extends Expr {
  constructor(
    readonly label: ExprLabel | null,
    readonly bracket: TokenGroup,
    readonly of: Stmt[],
  ) {
    super((label ?? bracket).start, of[of.length - 1]?.end ?? bracket.end)
  }
}

export class TypeBlock extends Type {
  constructor(readonly block: ExprBlock) {
    super(block.start, block.end)
  }
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

export class FnParam extends Node {
  constructor(
    readonly ident: Ident,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type,
  ) {
    super(ident.start, type.end)
  }
}

export class ItemFn extends Item {
  constructor(
    readonly kw: Token<typeof KFn>,
    readonly name: IdentFnName | null,
    readonly tparams: GenericParams | null,
    readonly params: List<FnParam> | null,
    readonly arrow: Token<typeof OArrowRet> | null,
    readonly retType: Type | null,
    readonly usageKw: Token<typeof KUsage> | null,
    readonly usages: PlainList<Expr> | null,
    readonly block: ExprBlock | null,
  ) {
    super(
      kw.start,
      (
        block ??
        usages ??
        usageKw ??
        retType ??
        arrow ??
        params ??
        tparams ??
        name ??
        kw
      ).end,
    )
  }
}

export class ItemRule extends Item {
  constructor(
    readonly kw: Token<typeof KRule>,
    readonly tparams: GenericParams | null,
    readonly lhs: Expr,
    readonly arrow: Token<typeof OArrowMap> | null,
    readonly rhs: Expr,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, rhs.end)
  }
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

export class StructField extends Node {
  constructor(
    readonly constKw: Token<typeof KConst> | null,
    readonly name: Ident | null,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type,
  ) {
    super((constKw ?? name).start, type.end)
  }
}

export class EnumVariant extends Node {
  constructor(
    readonly name: Token<typeof TSym>,
    readonly fields: List<StructField> | null,
  ) {
    super(name.start, (fields ?? name).end)
  }
}

export class ItemEnum extends Item {
  constructor(
    readonly kw: Token<typeof KEnum>,
    readonly name: Ident | null,
    readonly tparams: GenericParams | null,
    readonly variants: List<EnumVariant, Token<typeof ODotDot> | null> | null,
  ) {
    super(kw.start, (variants ?? tparams ?? name ?? kw).end)
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

export class ItemEnumMap extends Item {
  constructor(
    readonly kw: Token<typeof KEnum>,
    readonly name: Ident | null,
    readonly tparams: GenericParams | null,
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

export class ItemStruct extends Item {
  constructor(
    readonly kw: Token<typeof KStruct>,
    readonly name: Ident | null,
    readonly tparams: GenericParams | null,
    readonly fields: List<StructField, Token<typeof ODotDot> | null> | null,
  ) {
    super(kw.start, (fields ?? name ?? kw).end)
  }
}

export class ItemData extends Item {
  constructor(
    readonly data: Token<typeof KData>,
    readonly name: Ident | null,
    readonly colon: Token<typeof OColon> | null,
    readonly type: Type,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(data.start, (semi ?? type).end)
  }
}

export class ItemTest extends Item {
  constructor(
    readonly kw: Token<typeof KAssert>,
    readonly expr: Expr,
    readonly kwElse: Token<typeof KElse> | null,
    readonly message: Token<typeof TString> | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw.start, (semi ?? expr).end)
  }
}

export class ExposeAliases extends Node {
  constructor(
    readonly as: Token<typeof KAs>,
    readonly alias: IdentFnName | List<IdentFnName> | null,
  ) {
    super(as.start, (alias ?? as).end)
  }
}

export class ItemExposeFn extends Item {
  constructor(
    readonly kw1: Token<typeof KExpose>,
    readonly kw2: Token<typeof KFn>,
    readonly name: IdentFnName | null,
    readonly label: Token<typeof TString> | null,
    readonly as: ExposeAliases | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw1.start, (semi ?? as ?? label ?? name ?? kw2).end)
  }
}

export class ItemExposeType extends Item {
  constructor(
    readonly kw1: Token<typeof KExpose>,
    readonly kw2: Token<typeof KType>,
    readonly name: IdentFnName | null,
    readonly targs: List<Type> | null,
    readonly label: Token<typeof TString> | null,
    readonly as: ExposeAliases | null,
    readonly semi: Token<typeof OSemi> | null,
  ) {
    super(kw1.start, (semi ?? as ?? label ?? targs ?? name ?? kw2).end)
  }
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

// TODO: opaque
