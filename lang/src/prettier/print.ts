import type { Doc } from "prettier"
import { builders } from "prettier/doc.js"
import {
  AAmp,
  AAmpAmp,
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
  OAmp,
  OAmpAmp,
  OArrowRet,
  OBackslash,
  OBangUnary,
  OBar,
  OBarBar,
  ODot,
  ODotDot,
  OEq,
  OEqEq,
  OGe,
  OGt,
  OLBrace,
  OLe,
  OLt,
  OMinus,
  OMinusUnary,
  ONe,
  OPercent,
  OPlus,
  OSlash,
  OStar,
  OStarStar,
  OTildeUnary,
  TDeriv,
} from "../ast/kind"
import { ExposeFn, ExposeType } from "../ast/node/expose"
import {
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
} from "../ast/node/expr"
import {
  AssertionMessage,
  Bracketed,
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
} from "../ast/node/extra"
import {
  ItemAssert,
  ItemData,
  ItemEnum,
  ItemEnumMap,
  ItemExpose,
  ItemFn,
  ItemRule,
  ItemStruct,
  ItemType,
  ItemUse,
} from "../ast/node/item"
import type { Node } from "../ast/node/node"
import { PatLit, PatStruct, PatVar } from "../ast/node/pat"
import { StmtAssert, StmtExpr, StmtLet } from "../ast/node/stmt"
import {
  TypeArray,
  TypeBlock,
  TypeLit,
  TypeParen,
  TypeVar,
} from "../ast/node/type"
import { Token } from "../ast/token"

export interface Subprint<T> {
  (k: keyof T): Doc
  opt(k: keyof T): Doc
  alt(k: keyof T, ifNull: Doc): Doc
  sub<A extends keyof T>(a: A, b: keyof T[A], ifNull?: Doc): Doc
  all(k: keyof T): Doc[]
  paren(k: keyof T, force?: boolean): Doc
  as(node: unknown, f: () => Doc): Doc
}

const {
  fill,
  group,
  softline,
  line,
  ifBreak,
  indent,
  join,
  hardline,
  hardlineWithoutBreakParent,
} = builders

const BEq = 1
const BBarBar = 2
const BAmpAmp = 3
const BCmp = 4
const BArrowRet = 5
const BBar = 6
const BAmp = 7
const BSum = 8
const BProd = 9
const BStarStar = 10
const BDotDot = 11
const BBackslash = 12
const BUnary = 13

const bucket = {
  [OEq]: BEq,
  [AEq]: BEq,
  [OBarBar]: BBarBar,
  [ABarBar]: BBarBar,
  [OAmpAmp]: BAmpAmp,
  [AAmpAmp]: BAmpAmp,
  [OEqEq]: BCmp,
  [ONe]: BCmp,
  [OLt]: BCmp,
  [OGt]: BCmp,
  [OLe]: BCmp,
  [OGe]: BCmp,
  [AEqEq]: BCmp,
  [ANe]: BCmp,
  [ALt]: BCmp,
  [AGt]: BCmp,
  [ALe]: BCmp,
  [AGe]: BCmp,
  [OArrowRet]: BArrowRet,
  [OBar]: BBar,
  [ABar]: BBar,
  [OAmp]: BAmp,
  [AAmp]: BAmp,
  [OPlus]: BSum,
  [OMinus]: BSum,
  [APlus]: BSum,
  [AMinus]: BSum,
  [OStar]: BProd,
  [OSlash]: BProd,
  [OPercent]: BProd,
  [AStar]: BProd,
  [ASlash]: BProd,
  [APercent]: BProd,
  [OStarStar]: BStarStar,
  [AStarStar]: BStarStar,
  [ODotDot]: BDotDot,
  [OBackslash]: BBackslash,
  [ABackslash]: BBackslash,
  [OMinusUnary]: BUnary,
  [AMinusUnary]: BUnary,
  [OTildeUnary]: BUnary,
  [ATildeUnary]: BUnary,
  [OBangUnary]: BUnary,
  [ABangUnary]: BUnary,
} as const

/** @param rhs Should be `true` if parent is a unary. */
function needsParens(parentRaw: number, childRaw: number | null, rhs: boolean) {
  if (childRaw == null) {
    return false
  }

  const parent =
    parentRaw in bucket ? bucket[parentRaw as keyof typeof bucket] : null

  const child =
    childRaw in bucket ? bucket[childRaw as keyof typeof bucket] : null

  if (parent == null || child == null) {
    return true
  }

  switch (child) {
    // r
    case BEq:
    case BStarStar:
      return rhs ? parent > child : parent >= child

    // l
    case BBarBar:
    case BAmpAmp:
    case BArrowRet:
    case BBar:
    case BAmp:
    case BSum:
    case BProd:
      return rhs ? parent >= child : parent > child

    // 1
    case BCmp:
    case BDotDot:
    case BBackslash:
      return parent >= child

    // unary:
    case BUnary:
      return false
  }

  return true
}

function needsParensBeforeSuffix(node: Node) {
  return op(node) != null
}

function op(node: Node) {
  if (node instanceof ExprParen) {
    return op(node.of.value)
  }
  if (node instanceof ExprUnary) {
    return node.op.kind
  }
  if (node instanceof ExprBinary) {
    return node.op.kind
  }
  return null
}

function printIf(node: ExprIf, sb: Subprint<any>) {
  return [
    sb("kw"),
    " ",
    sb.paren("condition", needsParensToAvoidStruct(node.condition)),
    " ",
    ifBreak(
      sb.as((node as ExprIf).block?.of, () =>
        group([
          sb.sub("bracket", "lt"),
          indent([hardlineWithoutBreakParent, join(line, sb.all("items"))]),
          hardlineWithoutBreakParent,
          sb.sub("bracket", "gt"),
        ]),
      ),
      sb.sub("block", "of"),
    ),
    sb.opt("rest"),
  ]
}

function needsParensToAvoidStruct(node: Node): boolean {
  if (node instanceof ExprParen) {
    return needsParensToAvoidStruct(node.of.value)
  }
  if (node instanceof ExprStruct || node instanceof ExprSymStruct) {
    return true
  }
  if (
    node instanceof ExprIndex ||
    node instanceof ExprCall ||
    node instanceof ExprProp
  ) {
    return needsParensToAvoidStruct(node.on)
  }
  if (node instanceof ExprUnary) {
    return needsParensToAvoidStruct(node.of)
  }
  if (node instanceof ExprBinary) {
    return (
      needsParensToAvoidStruct(node.lhs) || needsParensToAvoidStruct(node.rhs)
    )
  }
  return false
}

function setBlockContentsToMultiline(node: Node) {
  if (node instanceof ExprParen) {
    setBlockContentsToMultiline(node.of.value)
  } else if (node instanceof ExprIf) {
    if (node.block) {
      node.block.of.block = true
    }
  } else if (node instanceof ExprFor) {
    if (node.block) {
      node.block.of.block = true
    }
  } else if (node instanceof ExprMatch) {
    if (node.arms) {
      node.arms.block = true
    }
  } else if (node instanceof ExprBlock) {
    node.of.block = true
  }
}

export const UNPRINTED = new Set<string>()

export function print(node: Node | Token<number>, sb: Subprint<any>) {
  switch (node.constructor) {
    case ExprLit:
      return (node as ExprLit).value.val
    case FnUsage:
      return [sb("kw"), " ", sb("usages")]
    case FnReturnType:
      return [sb("arrow"), " ", sb.paren("retType"), " "]
    case ItemFn:
      return [
        "fn ",
        sb("name"),
        sb.alt("tparams", ""),
        sb.alt("params", "()"),
        " ",
        sb.alt("ret", ""),
        sb.alt("usage", ""),
        sb.alt("block", "{}"),
      ]
    case ItemRule:
      return ["rule", sb.alt("tparams", ""), " ", sb.alt("value", ";")]
    case Rule:
      return [
        sb("lhs"),
        " ",
        sb.alt("arrow", "=>"),
        " ",
        sb("rhs"),
        sb.alt("semi", ";"),
      ]
    case Script:
      return join([hardline, hardline], sb.all("items"))
    case GenericParams:
      return sb("list")
    case PlainList: {
      const self = node as PlainList<any>

      const contents = self.items.map((x, i) =>
        x instanceof Expr && needsParensToAvoidStruct(x) ?
          group(["(", indent([softline, sb.sub("items", i)]), softline, ")"])
        : sb.sub("items", i),
      )

      return group([
        indent([softline, join([",", line], contents), ifBreak([","], "")]),
        line,
      ])
    }
    case List: {
      const self = node as List<any, any>

      if (self.items.length == 0 && !self.terminator) {
        if (self.block) {
          return group([
            sb.sub("bracket", "lt"),
            hardline,
            sb.sub("bracket", "gt"),
          ])
        }

        return [sb.sub("bracket", "lt"), sb.sub("bracket", "gt")]
      }

      const edge =
        self.block ? hardline
        : self.bracket.kind == OLBrace ? line
        : softline
      const br = self.commas ? [",", line] : line
      const comma = self.commas && self.items.length > 0 ? ifBreak(",") : ""

      return group([
        sb.sub("bracket", "lt"),
        indent([
          edge,
          join(
            br,
            sb.all("items").concat(self.terminator ? [sb("terminator")] : []),
          ),
          self.terminator ? "" : comma,
        ]),
        edge,
        sb.sub("bracket", "gt"),
      ])
    }
    case Token:
      return (node as Token<number>).val
    case ExprDeriv: {
      const self = node as ExprDeriv
      const needs = needsParens(TDeriv, op(self.of), true)
      return [
        sb("wrt"),
        needs ?
          group(["(", softline, indent(sb("of")), softline, ")"])
        : group([
            ifBreak("(", " "),
            softline,
            indent(sb("of")),
            softline,
            ifBreak(")"),
          ]),
      ]
    }
    case ExprParen:
      return sb.sub("of", "value")
    case ExprBinary: {
      // TODO: output like prettier for js
      const self = node as ExprBinary
      const needsL = needsParens(self.op.kind, op(self.lhs), false)
      const needsR = needsParens(self.op.kind, op(self.rhs), true)
      return group([
        needsL ? sb.paren("lhs", true) : sb("lhs"),
        indent([
          line,
          sb("op"),
          " ",
          needsR ? sb.paren("rhs", true) : sb("rhs"),
        ]),
      ])
    }
    case ExprVarParam:
      return [sb("name"), sb.opt("without"), sb.opt("type")]
    case VarWithout:
      return [sb("bang"), sb("names")]
    case GenericParam:
      return [sb("name"), sb.opt("type")]
    case ParamType:
      return [
        sb("colon"),
        " ",
        group([
          ifBreak("("),
          indent([softline, sb("type")]),
          softline,
          ifBreak(")"),
        ]),
      ]
    case TypeVar:
      return [sb("name"), sb.opt("targs")]
    case ExprBlock:
      return [sb.opt("label"), sb("of")]
    case ExprVar:
      return [sb("name"), sb.opt("targs"), sb.opt("args")]
    case StmtExpr: {
      const self = node as StmtExpr
      setBlockContentsToMultiline(self.expr)
      return [sb("expr"), self.semi != null ? sb.alt("semi", ";") : ""]
    }
    case TypeLit:
      return sb("token")
    case TypeBlock:
      return sb("block")
    case ExprExit: {
      const self = node as ExprExit
      return [
        sb("kw"),
        self.label ? [" ", sb("label")] : "",
        self.value ? [" ", sb.paren("value")] : "",
      ]
    }
    case ExprProp:
      return [
        sb.paren("on", needsParensBeforeSuffix((node as ExprProp).on)),
        sb("prop"),
        sb.opt("targs"),
        sb.opt("args"),
      ]
    case ExprCall:
      return [
        sb.paren("on", needsParensBeforeSuffix((node as ExprProp).on)),
        sb.opt("targs"),
        sb.opt("args"),
      ]
    case ExprIndex:
      return [
        sb.paren("on", needsParensBeforeSuffix((node as ExprProp).on)),
        sb("index"),
      ]
    case Prop:
      return [sb("dot"), sb("name")]
    case FnParam:
      return [sb("ident"), sb.alt("colon", ":"), " ", sb.paren("type")]
    case TypeParen:
      return sb("of")
    case ItemType:
      return [
        sb("kw"),
        " ",
        sb("ident"),
        " ",
        group([
          sb.sub("braces", "lt"),
          indent([hardline, sb("source")]),
          hardline,
          sb.sub("braces", "gt"),
        ]),
      ]
    case Source: {
      const self = node as Source
      if (self.parts.length == 1) {
        return group([
          sb.sub("parts", 0),
          self.cast ? line : "",
          sb.opt("cast"),
        ])
      } else {
        const lb = self.block ? hardline : line
        return group([
          join(lb, sb.all("parts")),
          indent([self.cast ? lb : "", sb.opt("cast")]),
        ])
      }
    }
    case PrescribedType:
      return group([sb("dcolon"), " ", sb.paren("type")])
    case SourceSingle: {
      const self = node as SourceSingle
      return [
        sb("kw"),
        self.lang ? " " : "",
        sb.opt("lang"),
        " ",
        sb.sub("braces", "lt"),
        self.parts.map((_, i) =>
          i == 0 ?
            sb.sub("parts", i)
          : [sb.sub("interps", i - 1), sb.sub("parts", i)],
        ),
        sb.sub("braces", "gt"),
      ]
    }
    case SourceInterp:
      return sb("of")
    case ExprIf:
      return group(printIf(node as ExprIf, sb))
    case Else: {
      const self = node as Else
      return [
        " ",
        sb("kw"),
        " ",
        self.block instanceof ExprBlock ?
          ifBreak(
            sb.as(self.block?.of, () =>
              group([
                sb.sub("bracket", "lt"),
                indent([
                  hardlineWithoutBreakParent,
                  join(hardlineWithoutBreakParent, sb.all("items")),
                ]),
                hardlineWithoutBreakParent,
                sb.sub("bracket", "gt"),
              ]),
            ),
            sb("block"),
          )
        : self.block instanceof ExprIf ?
          sb.as(self.block, () => printIf(self.block as ExprIf, sb))
        : sb("block"),
      ]
    }
    case ExprStruct:
    case ExprSymStruct:
      return [
        sb("name"),
        (node as ExprStruct).name.kind == ODot ? "" : " ",
        sb("args"),
      ]
    case StructArg:
      return [sb("name"), sb("colon"), " ", sb.paren("expr")]
    case ExprUnary: {
      const self = node as ExprUnary
      const needsR = needsParens(self.op.kind, op(self.of), true)
      return group([
        ifBreak("("),
        indent([sb("op"), indent([softline, sb.paren("of", needsR)])]),
        softline,
        ifBreak(")"),
      ])
    }
    case ExprArray:
      return sb("of")
    case Bracketed:
      return group([
        sb.sub("brack", "lt"),
        indent([softline, sb("value")]),
        softline,
        sb.sub("brack", "gt"),
      ])
    case ExprFor:
      return [
        sb.opt("label"),
        sb("kw"),
        " ",
        sb("bound"),
        sb("eq"),
        " ",
        sb("sources"),
        sb("block"),
      ]
    case ExprLabel:
      return [sb("label"), sb.alt("colon", ":"), " "]
    case ExprMatch:
      return [
        sb("kw"),
        " ",
        sb.paren("on", needsParensToAvoidStruct((node as ExprMatch).on)),
        " ",
        sb("arms"),
      ]
    case MatchArm:
      return [sb("pat"), " ", sb("arrow"), " ", sb.paren("expr")]
    case PatVar:
      return sb("name")
    case PatLit:
      return sb("name")
    case PatStruct:
      return [
        sb("name"),
        (node as PatStruct).name.kind == ODot ? "" : " ",
        sb("of"),
      ]
    case StructPatProp:
      return [sb("key"), sb.opt("pat")]
    case StructPatPropPat:
      return [sb("colon"), " ", sb("pat")]
    case ExprRange: {
      const self = node as ExprRange
      const needsL = self.lhs && needsParens(BDotDot, op(self.lhs), false)
      const needsR = self.rhs && needsParens(BDotDot, op(self.rhs), true)
      return [
        needsL == null ? "" : sb.paren("lhs", needsL),
        sb("op"),
        needsR == null ? "" : sb.paren("rhs", needsR),
      ]
    }
    case ItemUse:
      return [sb("kw"), " ", sb("source"), sb.alt("semi", ";")]
    case ItemEnum:
      const v = (node as ItemEnum).variants
      if (v) {
        v.block = true
      }
      return [sb("kw"), " ", sb("name"), sb.opt("tparams"), " ", sb("variants")]
    case ExprEmpty:
      throw new Error("Empty expression.")
    case EnumVariant:
      return [
        sb("name"),
        (node as EnumVariant).fields ? " " : "",
        sb.opt("fields"),
      ]
    case StructFieldDecl:
      return [
        sb.opt("constKw"),
        (node as StructFieldDecl).constKw ? " " : "",
        sb("name"),
        sb("colon"),
        " ",
        sb.paren("type"),
      ]
    case ItemEnumMap: {
      const v = (node as ItemEnumMap).variants
      if (v) {
        v.block = true
      }
      return [
        sb("kw"),
        " ",
        sb("name"),
        sb.opt("tparams"),
        " ",
        sb("arrow"),
        " ",
        sb("ret"),
        " ",
        sb("variants"),
      ]
    }
    case EnumMapVariant:
      return [sb("name"), " ", sb("arrow"), " ", sb.paren("of")]
    case ItemStruct: {
      const v = (node as ItemStruct).fields
      if (v) {
        v.block = true
      }
      return [sb("kw"), " ", sb("name"), sb.opt("tparams"), " ", sb("fields")]
    }
    case TypeArray:
    case ExprArrayByRepetition: {
      return group([
        sb.sub("brack", "lt"),
        indent([
          softline,
          sb("of"),
          sb("semi"),
          line,
          sb.as((node as TypeArray).sizes, () =>
            fill(join([",", line], sb.all("items"))),
          ),
          ifBreak(","),
        ]),
        softline,
        sb.sub("brack", "gt"),
      ])
    }
    case StmtLet:
      return [
        sb("kw"),
        " ",
        sb("ident"),
        sb.opt("type"),
        sb.opt("value"),
        sb.alt("semi", ";"),
      ]
    case Initializer:
      return [" ", sb("eq"), " ", sb("value")]
    case ExprCast:
      return [sb.paren("lhs"), " ", sb("op"), " ", sb("rhs")]
    case ItemExpose:
      return [sb("kw"), " ", sb("item")]
    case ExposeFn:
    case ExposeType:
      return [
        sb("kw"),
        " ",
        sb("name"),
        sb.opt("targs"),
        " ",
        sb("label"),
        sb("as"),
        sb.alt("semi", ";"),
      ]
    case ExposeAliases:
      return [" ", sb("as"), " ", sb("alias")]
    case ItemData:
      return [
        sb("data"),
        (node as ItemData).local ? " " : "",
        sb.opt("local"),
        " ",
        sb("name"),
        sb("colon"),
        " ",
        sb("type"),
        sb.alt("semi", ";"),
      ]
    case ItemAssert:
    case StmtAssert:
      return [
        sb("kw"),
        " ",
        sb.paren("expr"),
        sb.opt("message"),
        sb.alt("semi", ";"),
      ]
    case AssertionMessage:
      return [" ", sb("kw"), " ", sb("message")]
  }

  UNPRINTED.add(node.constructor.name)
  return node.constructor.name
}
