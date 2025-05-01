import type { EmitBlock } from "../../emit/block"
import type { ScopeBlock } from "../../emit/scope"
import { type VType } from "../../emit/type"
import { Value } from "../../emit/value"
import {
  KFalse,
  KTrue,
  TFloat,
  TIdent,
  TInt,
  TSym,
  type AAmp,
  type AAmpAmp,
  type AAt,
  type ABackslash,
  type ABangUnary,
  type ABar,
  type ABarBar,
  type AEq,
  type AEqEq,
  type AGe,
  type AGt,
  type ALe,
  type ALt,
  type AMinus,
  type AMinusUnary,
  type ANe,
  type APercent,
  type APlus,
  type ASlash,
  type AStar,
  type AStarStar,
  type ATildeUnary,
  type KBreak,
  type KContinue,
  type KElse,
  type KFor,
  type KIf,
  type KIn,
  type KMatch,
  type KReturn,
  type KSource,
  type OAmp,
  type OAmpAmp,
  type OArrowRet,
  type OAt,
  type OBackslash,
  type OBangUnary,
  type OBar,
  type OBarBar,
  type OColonColon,
  type ODot,
  type ODotDot,
  type OEq,
  type OEqEq,
  type OGe,
  type OGt,
  type OLBrace,
  type OLBrack,
  type OLe,
  type OLInterp,
  type OLParen,
  type OLt,
  type OMinus,
  type OMinusUnary,
  type ONe,
  type OPercent,
  type OPlus,
  type OSemi,
  type OSlash,
  type OStar,
  type OStarStar,
  type OTildeUnary,
  type TBuiltin,
  type TDeriv,
  type TDerivIgnore,
  type TLabel,
  type TParam,
  type TSource,
} from "../kind"
import type { TokenGroup } from "../stream"
import type { Token } from "../token"
import type {
  ExprLabel,
  List,
  MatchArm,
  PlainList,
  Prop,
  StructArg,
  VarPrescribedType,
  VarWithout,
} from "./extra"
import type { Ident } from "./node"
import { Node } from "./node"
import type { Stmt } from "./stmt"
import type { Type } from "./type"

export abstract class Expr extends Node {
  declare private __brand_expr

  /**
   * @param scope A scope holding function, type, and variable names.
   * @param block A place to put contextually needed statements.
   * @param result The expected result type.
   */
  emit(scope: ScopeBlock, block: EmitBlock, result: VType | null): Value {
    scope
    block
    result
    throw new Error(`Cannot emit '${this.constructor.name}' yet.`)
  }
}

/**
 * ```nya
 * 2 // int literal
 * 2.4 // float literal
 * true // bool literal
 * :world // symbol literal
 * ```
 */
export class ExprLit extends Expr {
  constructor(
    readonly value: Token<
      typeof TFloat | typeof TInt | typeof TSym | typeof KTrue | typeof KFalse
    >,
  ) {
    super(value.start, value.end)
  }
}

/**
 * ```nya
 * $a // parameter to a rule or interpolation of a rule parameter
 * $a!x // parameter which doesn't depend on variable `x`
 * $a::normaldist // parameter which is of type `normaldist`
 * $a!x::normaldist // parameter constant w.r.t. `x` of type `normaldist`
 * ```
 */
export class ExprVarParam extends Expr {
  constructor(
    readonly name: Token<typeof TParam>,
    readonly without: VarWithout | null,
    readonly type: VarPrescribedType | null,
  ) {
    super(name.start, (type ?? without ?? name).end)
  }
}

/**
 * ```nya
 * a // variable reference or zero-argument function call
 * a<23>; // zero-argument function call with type args
 * a(45) // function call
 * ```
 */
export class ExprVar extends Expr {
  constructor(
    readonly name: Token<typeof TIdent | typeof TBuiltin>,
    readonly targs: List<Type> | null,
    readonly args: List<Expr> | null,
  ) {
    super(name.start, (args ?? targs ?? name).end)
  }
}

export class ExprStruct extends Expr {
  constructor(
    readonly name: Token<typeof TIdent | typeof TBuiltin | typeof ODot>,
    readonly args: List<StructArg> | null,
  ) {
    super(name.start, (args ?? name).end)
  }
}

export class ExprSymStruct extends Expr {
  constructor(
    readonly name: Token<typeof TSym>,
    readonly args: List<StructArg> | null,
  ) {
    super(name.start, (args ?? name).end)
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
  | typeof OMinusUnary
  | typeof AMinusUnary
  | typeof OTildeUnary
  | typeof ATildeUnary
  | typeof OBangUnary
  | typeof ABangUnary

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

export class ExprBlock extends Expr {
  constructor(
    readonly label: ExprLabel | null,
    readonly of: List<Stmt>,
  ) {
    super((label ?? of).start, of.end)
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
