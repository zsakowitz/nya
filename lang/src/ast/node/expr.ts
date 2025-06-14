import type { Chunk } from "../issue"
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
  type ACarat,
  type AEq,
  type AEqEq,
  type AGe,
  type AGt,
  type AHash,
  type ALe,
  type ALt,
  type AMinus,
  type AMinusUnary,
  type ANe,
  type APercent,
  type APlus,
  type ASlash,
  type AStar,
  type ATildeEq,
  type ATildeUnary,
  type KBreak,
  type KCall,
  type KContinue,
  type KFor,
  type KIf,
  type KMap,
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
  type OCarat,
  type ODot,
  type ODotDot,
  type OEq,
  type OEqEq,
  type OGe,
  type OGt,
  type OHash,
  type OLBrace,
  type OLBrack,
  type OLe,
  type OLInterp,
  type OLParen,
  type OLt,
  type OMinus,
  type OMinusUnary,
  type ONe,
  type OOverloadable,
  type OPercent,
  type OPlus,
  type OSemi,
  type OSlash,
  type OStar,
  type OTildeEq,
  type OTildeUnary,
  type RString,
  type RTag,
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
  Bracketed,
  Else,
  ForHeaders,
  Label,
  List,
  MatchArm,
  PlainList,
  PrescribedType,
  Prop,
  StructArg,
  VarWithout,
} from "./extra"
import type { Ident } from "./node"
import { Node } from "./node"
import type { NodeStmt } from "./stmt"
import type { NodeType } from "./type"

export abstract class NodeExpr extends Node {
  declare private __brand_expr
}

/**
 * ```nya
 * 2 // int literal
 * 2.4 // float literal
 * true // bool literal
 * :world // symbol literal
 * ```
 */
export class ExprLit extends NodeExpr {
  constructor(
    readonly value: Token<
      typeof TFloat | typeof TInt | typeof TSym | typeof KTrue | typeof KFalse
    >,
  ) {
    super(value.start, value.end, value.info)
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
export class ExprVarParam extends NodeExpr {
  constructor(
    readonly name: Token<typeof TParam>,
    readonly without: VarWithout | null,
    readonly type: PrescribedType | null,
  ) {
    super(name.start, (type ?? without ?? name).end, name.info)
  }
}

/**
 * ```nya
 * a // variable reference or zero-argument function call
 * a<23>; // zero-argument function call with type args
 * a(45) // function call
 * ```
 */
export class ExprVar extends NodeExpr {
  constructor(
    readonly name: Token<typeof TIdent | typeof TBuiltin>,
    readonly targs: List<NodeType> | null,
    readonly args: List<NodeExpr> | null,
  ) {
    super(name.start, (args ?? targs ?? name).end, name.info)
  }
}

export class ExprDirectCall extends NodeExpr {
  constructor(
    readonly kw: Token<typeof KCall>,
    readonly name1: Token<
      typeof TIdent | typeof TBuiltin | OOverloadable
    > | null,
    readonly name2: Token<
      typeof TIdent | typeof TBuiltin | OOverloadable
    > | null,
    readonly targs: List<NodeType> | null,
    readonly args: List<NodeExpr> | null,
  ) {
    super(kw.start, (args ?? targs ?? name2 ?? name1 ?? kw).end, kw.info)
  }
}

export class ExprStruct extends NodeExpr {
  constructor(
    readonly name: Token<typeof TIdent | typeof TBuiltin | typeof ODot>,
    // TODO: this needs targs eventually
    readonly args: List<StructArg> | null,
  ) {
    super(name.start, (args ?? name).end, name.info)
  }
}

export class ExprSymStruct extends NodeExpr {
  constructor(
    readonly name: Token<typeof TSym>,
    readonly args: List<StructArg> | null,
  ) {
    super(name.start, (args ?? name).end, name.info)
  }
}

export class ExprEmpty extends NodeExpr {
  constructor(
    readonly at: number,
    info: Chunk,
  ) {
    super(at, at, info)
  }
}

export class ExprIf extends NodeExpr {
  constructor(
    readonly kw: Token<typeof KIf>,
    readonly condition: NodeExpr,
    readonly block: ExprBlock | null,
    readonly rest: Else | null,
  ) {
    super(kw.start, (rest ?? block ?? condition).end, kw.info)
  }
}

export class ExprFor extends NodeExpr {
  constructor(
    readonly label: Label | null,
    readonly kw: Token<typeof KFor> | Token<typeof KMap>,
    readonly headers: ForHeaders,
    readonly block: ExprBlock | null,
  ) {
    super((label ?? kw).start, (block ?? headers).end, kw.info)
  }
}

export class ExprExit extends NodeExpr {
  constructor(
    readonly kw: Token<typeof KReturn | typeof KBreak | typeof KContinue>,
    readonly label: Token<typeof TLabel> | null,
    readonly value: NodeExpr | null,
  ) {
    super(kw.start, (value ?? label ?? kw).end, kw.info)
  }
}

export class ExprMatch extends NodeExpr {
  constructor(
    readonly kw: Token<typeof KMatch>,
    readonly on: NodeExpr,
    readonly arms: List<MatchArm> | null,
  ) {
    super(kw.start, (arms ?? kw).end, kw.info)
  }
}

export class ExprParen extends NodeExpr {
  constructor(readonly of: Bracketed<typeof OLParen, NodeExpr>) {
    super(of.start, of.end, of.info)
  }
}

export class ExprArray extends NodeExpr {
  constructor(readonly of: List<NodeExpr>) {
    super(of.start, of.end, of.info)
  }
}

export class ExprArrayByRepetition extends NodeExpr {
  constructor(
    readonly brack: TokenGroup<typeof OLBrack>,
    readonly of: NodeExpr,
    readonly semi: Token<typeof OSemi> | null,
    readonly sizes: PlainList<NodeExpr>,
  ) {
    super(brack.start, sizes.end, brack.info)
  }
}

export class ExprCall extends NodeExpr {
  constructor(
    readonly on: NodeExpr,
    readonly targs: List<NodeType> | null,
    readonly args: List<NodeExpr> | null,
  ) {
    super(on.start, (args ?? targs ?? on).end, on.info)
  }
}

export class ExprProp extends NodeExpr {
  constructor(
    readonly on: NodeExpr,
    readonly prop: Prop,
    readonly targs: List<NodeType> | null,
    readonly args: List<NodeExpr> | null,
  ) {
    super(on.start, (args ?? targs ?? prop).end, on.info)
  }
}

export class ExprIndex extends NodeExpr {
  constructor(
    readonly on: NodeExpr,
    readonly index: Bracketed<typeof OLBrack, NodeExpr>,
  ) {
    super(on.start, index.end, on.info)
  }
}

export type ExprUnaryOp =
  | typeof OMinusUnary
  | typeof AMinusUnary
  | typeof OTildeUnary
  | typeof ATildeUnary
  | typeof OBangUnary
  | typeof ABangUnary

export class ExprUnary extends NodeExpr {
  constructor(
    readonly op: Token<ExprUnaryOp>,
    readonly of: NodeExpr,
  ) {
    super(op.start, of.end, op.info)
  }
}

// d/dx notation is used as a shorthand since we need to represent a lot of derivatives
export class ExprDeriv extends NodeExpr {
  constructor(
    readonly wrt: Token<typeof TDeriv | typeof TDerivIgnore>,
    readonly of: NodeExpr,
  ) {
    super(wrt.start, wrt.end, wrt.info)
  }
}

export type ExprBinaryOp =
  | typeof OPlus
  | typeof OMinus
  | typeof OStar
  | typeof OSlash
  | typeof OHash
  | typeof OCarat
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
  | typeof AHash
  | typeof ACarat
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
  | typeof OTildeEq
  | typeof ATildeEq

export class ExprBinary extends NodeExpr {
  constructor(
    readonly lhs: NodeExpr,
    readonly op: Token<ExprBinaryOp>,
    readonly rhs: NodeExpr,
  ) {
    super(lhs.start, rhs.end, lhs.info)
  }
}

export class ExprBinaryAssign extends NodeExpr {
  constructor(
    readonly lhs: NodeExpr,
    readonly op: Token<ExprBinaryOp>,
    readonly eq: Token<typeof OEq>,
    readonly rhs: NodeExpr,
  ) {
    super(lhs.start, rhs.end, lhs.info)
  }
}

export class ExprRange extends NodeExpr {
  constructor(
    readonly lhs: NodeExpr | null,
    readonly op: Token<typeof ODotDot>,
    readonly rhs: NodeExpr | null,
  ) {
    super((lhs ?? op).start, (rhs ?? op).end, op.info)
  }
}

export class ExprCast extends NodeExpr {
  constructor(
    readonly lhs: NodeExpr,
    readonly op: Token<typeof OArrowRet>,
    readonly rhs: NodeType,
  ) {
    super(lhs.start, rhs.end, op.info)
  }
}

export class ExprBlock extends NodeExpr {
  constructor(
    readonly label: Label | null,
    readonly of: List<NodeStmt>,
  ) {
    super((label ?? of).start, of.end, of.info)
  }
}

export class ExprTaggedString extends NodeExpr {
  constructor(
    readonly tag: Token<typeof RTag>,
    readonly parts: Token<typeof RString>[],
    readonly interps: NodeExpr[],
    end: number,
  ) {
    super(tag.start, end, tag.info)
  }
}

export class SourceSingle extends NodeExpr {
  constructor(
    readonly kw: Token<typeof KSource>,
    readonly lang: Ident | null,
    readonly braces: TokenGroup<typeof OLBrace> | null,
    readonly parts: Token<typeof TSource>[],
    readonly interps: SourceInterp[],
  ) {
    super(kw.start, (braces ?? lang ?? kw).end, kw.info)
  }
}

export class Source extends NodeExpr {
  constructor(
    start: number,
    end: number,
    readonly parts: SourceSingle[],
    readonly cast: PrescribedType | null,
    /** Whether to print as multiline. */
    public block: boolean,
  ) {
    super(start, end, (parts[0] ?? cast)!.info)
  }
}

export class SourceInterp extends NodeExpr {
  constructor(readonly of: Bracketed<typeof OLInterp, NodeExpr>) {
    super(of.start, of.end, of.info)
  }
}
