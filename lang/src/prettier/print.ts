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
import {
  ExprBinary,
  ExprBlock,
  ExprDeriv,
  ExprExit,
  ExprFor,
  ExprIf,
  ExprLit,
  ExprMatch,
  ExprParen,
  ExprProp,
  ExprUnary,
  ExprVar,
  ExprVarParam,
} from "../ast/node/expr"
import {
  FnParam,
  FnReturnType,
  FnUsage,
  GenericParam,
  GenericParams,
  List,
  ParamType,
  PlainList,
  Prop,
  Rule,
  Script,
  VarWithout,
} from "../ast/node/extra"
import { ItemFn, ItemRule } from "../ast/node/item"
import type { Node } from "../ast/node/node"
import { StmtExpr } from "../ast/node/stmt"
import { TypeBlock, TypeLit, TypeParen, TypeVar } from "../ast/node/type"
import { Token } from "../ast/token"

export interface Subprint<T> {
  (k: keyof T): Doc
  opt(k: keyof T): Doc
  alt(k: keyof T, ifNull: Doc): Doc
  sub<A extends keyof T>(a: A, b: keyof T[A], ifNull?: Doc): Doc
  all(k: keyof T): Doc[]
  paren(k: keyof T, force?: boolean): Doc
}

const { group, softline, line, ifBreak, indent, join, hardline } = builders

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
    return op(node.of)
  }
  if (node instanceof ExprUnary) {
    return node.op.kind
  }
  if (node instanceof ExprBinary) {
    return node.op.kind
  }
  return null
}

function exprNeedsSemi(node: Node) {
  if (node instanceof ExprParen) {
    return exprNeedsSemi(node.of)
  }
  return !(
    node instanceof ExprIf ||
    node instanceof ExprFor ||
    node instanceof ExprBlock ||
    node instanceof ExprMatch
  )
}

export function print(node: Node | Token<number>, sb: Subprint<any>) {
  const sp = sb

  switch (node.constructor) {
    case ExprLit:
      return (node as ExprLit).value.val
    case FnUsage:
      return [sp("kw"), " ", sp("usages")]
    case FnReturnType:
      return [sp("arrow"), " ", sp.paren("retType"), " "]
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
      return ["rule", sp.alt("tparams", ""), " ", sp.alt("value", ";")]
    case Rule:
      return [
        sp("lhs"),
        " ",
        sp.alt("arrow", "=>"),
        " ",
        sp("rhs"),
        sp.alt("semi", ";"),
      ]
    case Script:
      return join([hardline, hardline], sp.all("items"))
    case GenericParams:
      return sp("list")
    case PlainList:
      return group([
        indent([
          softline,
          join([",", line], sp.all("items")),
          ifBreak([","], ""),
        ]),
        line,
      ])
    case List: {
      const self = node as List<any, any>
      const edge =
        self.block && self.items.length >= 2 ? hardline
        : self.bracket.kind == OLBrace ? line
        : softline
      const br = self.commas ? [",", line] : line
      const comma = self.commas ? ifBreak(",") : ""

      return group([
        sp.sub("bracket", "lt"),
        indent([edge, join(br, sp.all("items")), comma]),
        edge,
        sp.sub("bracket", "gt"),
      ])
    }
    case Token:
      return (node as Token<number>).val
    case ExprDeriv: {
      const self = node as ExprDeriv
      const needs = needsParens(TDeriv, op(self.of), true)
      return [
        sp("wrt"),
        needs ?
          group(["(", softline, indent(sp("of")), softline, ")"])
        : group([
            ifBreak("(", " "),
            softline,
            indent(sp("of")),
            softline,
            ifBreak(")"),
          ]),
      ]
    }
    case ExprParen:
      return sp("of")
    case ExprBinary: {
      const self = node as ExprBinary
      const needsL = needsParens(self.op.kind, op(self.lhs), false)
      const needsR = needsParens(self.op.kind, op(self.rhs), true)
      return group([
        ifBreak("("),
        indent([
          softline,
          sp.paren("lhs", needsL),
          " ",
          sp("op"),
          indent([line, sp.paren("rhs", needsR)]),
        ]),
        softline,
        ifBreak(")"),
      ])
    }
    case ExprVarParam:
      return [sp("name"), sp.opt("without"), sp.opt("type")]
    case VarWithout:
      return [sp("bang"), sp("names")]
    case GenericParam:
      return [sp("name"), sp.opt("type")]
    case ParamType:
      return [
        sp("colon"),
        " ",
        group([
          ifBreak("("),
          indent([softline, sp("type")]),
          softline,
          ifBreak(")"),
        ]),
      ]
    case TypeVar:
      return [sp("name"), sp.opt("targs")]
    case ExprBlock:
      return [sp.opt("label"), sp("of")]
    case ExprVar:
      return [sp("name"), sp.opt("targs"), sp.opt("args")]
    case StmtExpr: {
      const self = node as StmtExpr
      return [sp("expr"), self.semi != null ? sp.alt("semi", ";") : ""]
    }
    case TypeLit:
      return sp("token")
    case TypeBlock:
      return sp("block")
    case ExprExit: {
      const self = node as ExprExit
      return [
        sp("kw"),
        self.label ? [" ", sp("label")] : "",
        self.value ? [" ", sp.paren("value")] : "",
      ]
    }
    case ExprProp:
      return [
        sp.paren("on", needsParensBeforeSuffix((node as ExprProp).on)),
        sp("prop"),
        sp.opt("targs"),
        sp.opt("args"),
      ]
    case Prop:
      return [sp("dot"), sp("name")]
    case FnParam:
      return [sp("ident"), sp.alt("colon", ":"), " ", sp.paren("type")]
    case TypeParen:
      return sp("of")
  }

  return node.constructor.name
}
