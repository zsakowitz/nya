import type { Doc } from "prettier"
import { builders } from "prettier/doc.js"
import type { Subprint } from "."
import {
  AAmp,
  AAmpAmp,
  AAt,
  ABackslash,
  ABangUnary,
  ABar,
  ABarBar,
  ACarat,
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
  ATildeEq,
  ATildeUnary,
  OAmp,
  OAmpAmp,
  OArrowRet,
  OAt,
  OBackslash,
  OBangUnary,
  OBar,
  OBarBar,
  OCarat,
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
  OTildeEq,
  OTildeUnary,
  TDeriv,
} from "../ast/kind"
import { ExposeFn, ExposeLet, ExposeType } from "../ast/node/expose"
import {
  ExprArray,
  ExprArrayByRepetition,
  ExprBinary,
  ExprBinaryAssign,
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
  ExprTaggedString,
  ExprUnary,
  ExprVar,
  ExprVarParam,
  NodeExpr,
  Source,
  SourceInterp,
  SourceSingle,
} from "../ast/node/expr"
import {
  AssertionMessage,
  Bracketed,
  Comments,
  Else,
  EnumMapVariant,
  EnumVariant,
  ExposeAliases,
  FnParam,
  FnReturnTypePlain,
  FnReturnTypeTypeof,
  FnUsage,
  ForHeader,
  ForHeaders,
  GenericParam,
  GenericParams,
  Initializer,
  Label,
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
  ItemComment,
  ItemData,
  ItemEnum,
  ItemEnumMap,
  ItemExpose,
  ItemFn,
  ItemLet,
  ItemRule,
  ItemStruct,
  ItemType,
  ItemTypeAlias,
  ItemUse,
} from "../ast/node/item"
import type { Node } from "../ast/node/node"
import { PatIgnore, PatLit, PatStruct, PatVar } from "../ast/node/pat"
import { StmtAssert, StmtComment, StmtExpr, StmtLet } from "../ast/node/stmt"
import {
  TypeAlt,
  TypeAny,
  TypeArray,
  TypeArrayUnsized,
  TypeBlock,
  TypeLit,
  TypeParen,
  TypeSyntax,
  TypeVar,
} from "../ast/node/type"
import { Token } from "../ast/token"

const {
  group,
  softline,
  line,
  ifBreak,
  indent,
  join,
  hardline,
  hardlineWithoutBreakParent,
  lineSuffix,
  fill,
  breakParent,
} = builders

const BEq = 1
const BDynArraySize = 2
const BBarBar = 3
const BAmpAmp = 4
const BCmp = 5
const BArrowRet = 6
const BBar = 7
const BAmp = 8
const BSum = 9
const BProd = 10
const BStarStar = 11
const BDotDot = 12
const BBackslash = 13
const BUnary = 14

const bucket = {
  [OEq]: BEq,
  [AEq]: BEq,
  [OAt]: BDynArraySize,
  [AAt]: BDynArraySize,
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
  [OTildeEq]: BCmp,
  [AEqEq]: BCmp,
  [ANe]: BCmp,
  [ALt]: BCmp,
  [AGt]: BCmp,
  [ALe]: BCmp,
  [AGe]: BCmp,
  [ATildeEq]: BCmp,
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
  [OCarat]: BStarStar,
  [ACarat]: BStarStar,
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

function printIf(node: ExprIf, sb: Subprint) {
  return [
    sb("kw"),
    " ",
    sb.paren("condition", needsParensToAvoidStruct(node.condition)),
    " ",
    ifBreak(
      sb.as(["block", "of"], () => {
        const items = sb.all("items")
        const ln = items.length >= 2 ? hardline : hardlineWithoutBreakParent
        return group([
          sb.sub("bracket", "lt"),
          indent([ln, join(line, items)]),
          ln,
          sb.sub("bracket", "gt"),
        ])
      }),
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
  } else if (node instanceof Source) {
    node.block = true
  } else if (node instanceof ExprBlock) {
    node.of.block = true
  }
}

export const UNPRINTED = new Set<string>()

function unwrap(node: NodeExpr): NodeExpr {
  return node instanceof ExprParen ? node.of.value : node
}

function numText(node: NodeExpr): string | null {
  if (node instanceof ExprLit) {
    return node.value.val
  }
  if (node instanceof ExprUnary && node.op.kind == OMinusUnary) {
    const rhs = unwrap(node.of)
    if (rhs instanceof ExprLit) {
      return `-${rhs.value.val}`
    }
  }
  return null
}

function polyText(node: ExprBinary): string | null {
  let lhs, rhs, name, inner
  if (
    node.op.kind == OPlus &&
    (lhs = numText(node.lhs)) &&
    (rhs = unwrap(node.rhs)) instanceof ExprBinary &&
    rhs.op.kind == OStar &&
    (name = unwrap(rhs.lhs)) instanceof ExprVar &&
    !name.targs &&
    !name.args &&
    ((inner = unwrap(rhs.rhs)),
    inner instanceof ExprBinary ||
      inner instanceof ExprLit ||
      inner instanceof ExprUnary)
  ) {
    let rhs =
      inner instanceof ExprBinary ? `(${polyText(inner)})` : numText(inner)
    if (rhs != null) {
      return `${lhs} + ${name.name.value} * ${rhs}`
    }
  }

  return null
}

export function print(node: Node | Token<number>, sb: Subprint): Doc {
  switch (node.constructor) {
    case ExprLit:
      return (node as ExprLit).value.val
    case FnUsage:
      return [sb("kw"), " ", sb("usages")]
    case FnReturnTypePlain:
      return [sb("arrow"), " ", sb.paren("retType")]
    case ItemFn: {
      const self = node as ItemFn
      if (self.usage?.usages) {
        self.usage.usages.spaceAfter = !self.semi
      }
      return [
        sb("kw"),
        " ",
        sb("name"),
        sb.alt("tparams", ""),
        sb.alt("params", "()"),
        self.ret ? " " : "",
        sb.alt("ret", ""),
        self.usage ? " " : "",
        sb.alt("usage", ""),
        !self.usage && !self.semi ? " " : "",
        self.semi ? sb.alt("semi", ";") : sb.alt("block", "{}"),
      ]
    }
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
      return (node as Script).items.map((x, i, a) => {
        const next = a[i + 1]
        const tilNext = sb.source.slice(x.end, next?.start)
        const n1 = tilNext.indexOf("\n")
        const n2 = n1 != -1 && tilNext.includes("\n", n1 + 1)
        return [
          sb.sub("items", i),
          next && n2 ? [hardline, hardline] : hardline,
        ]
      })
    case GenericParams:
      return sb("list")
    case PlainList: {
      const self = node as PlainList<any>

      const contents = self.items.map((x, i) =>
        x instanceof NodeExpr && needsParensToAvoidStruct(x) ?
          group(["(", indent([softline, sb.sub("items", i)]), softline, ")"])
        : sb.sub("items", i),
      )

      return group([
        indent([softline, join([",", line], contents), ifBreak([","], "")]),
        self.spaceAfter ? line : softline,
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

      // common case when extra line breaks may be desired
      if (!self.terminator && self.bracket.kind == OLBrace && !self.commas) {
        if (self.block) {
          return group([
            sb.sub("bracket", "lt"),
            indent([
              hardline,
              (node as Script).items.map((x, i, a) => {
                const next = a[i + 1]
                const tilNext = sb.source.slice(x.end, next?.start)
                const n1 = tilNext.indexOf("\n")
                const n2 = n1 != -1 && tilNext.includes("\n", n1 + 1)
                return [
                  sb.sub("items", i),
                  next ?
                    n2 ? [hardline, hardline]
                    : hardline
                  : "",
                ]
              }),
            ]),
            hardline,
            sb.sub("bracket", "gt"),
          ])
        }

        if (self.items.length >= 2) {
          return group([
            sb.sub("bracket", "lt"),
            indent([
              hardline,
              (node as Script).items.map((x, i, a) => {
                const next = a[i + 1]
                const tilNext = sb.source.slice(x.end, next?.start)
                const n1 = tilNext.indexOf("\n")
                const n2 = n1 != -1 && tilNext.includes("\n", n1 + 1)
                return [
                  sb.sub("items", i),
                  next ?
                    n2 ? [hardline, hardline]
                    : hardline
                  : "",
                ]
              }),
            ]),
            hardline,
            sb.sub("bracket", "gt"),
          ])
        }
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
      const res = polyText(self)
      if (res != null)
        return res.split("\n").map((x, i) => (i == 0 ? x : [hardline, x]))
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
    case ExprBinaryAssign: {
      // TODO: output like prettier for js
      const self = node as ExprBinaryAssign
      const needsL = needsParens(self.eq.kind, op(self.lhs), false)
      const needsR = needsParens(self.eq.kind, op(self.rhs), true)
      return group([
        needsL ? sb.paren("lhs", true) : sb("lhs"),
        indent([
          line,
          sb("op"),
          sb("eq"),
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
    case ExprProp: {
      let self = node as NodeExpr
      const suffixes: Doc[] = []
      while (self instanceof ExprProp) {
        suffixes.unshift([
          softline,
          sb.run(self.prop),
          self.targs ? sb.run(self.targs) : "",
          self.args ? sb.run(self.args) : "",
        ])
        self = self.on
        while (self instanceof ExprParen) {
          self = self.of.value
        }
      }
      return group([
        suffixes.length > 2 ? breakParent : "",
        sb.runParen(self, needsParensBeforeSuffix(self)),
        indent(suffixes),
      ])
    }
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
    case ExprTaggedString: {
      const self = node as ExprTaggedString
      const hashesNeeded = self.parts.reduce(
        (a, x) =>
          Math.max(
            a,
            x.val.match(/"#*/)?.reduce((a, x) => Math.max(a, x.length), 0) ?? 0,
          ),
        0,
      )
      const ret = [sb("tag"), "#".repeat(hashesNeeded), '"']
      for (let i = 0; i < self.parts.length; i++) {
        ret.push(sb.sub("parts", i))
        if (i != self.parts.length - 1) {
          ret.push(group(["${", sb.sub("interps", i), "}"]))
        }
      }
      ret.push('"', "#".repeat(hashesNeeded))
      return group(ret)
    }
    case PrescribedType:
      return group([
        sb("dcolon"),
        (node as PrescribedType).spaced ? " " : "",
        sb.paren("type"),
      ])
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
            sb.as(["block", "of"], () =>
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
          sb.as("block", () => printIf(self.block as ExprIf, sb))
        : sb("block"),
      ]
    }
    case ExprStruct:
    case ExprSymStruct: {
      const self = node as ExprStruct | ExprSymStruct
      const forceBreak =
        self.args?.items[0] &&
        self.info.source
          .slice(self.args.start, self.args.items[0].start)
          .includes("\n")
      if (forceBreak) {
        self.args.block = true
      }
      return [
        sb("name"),
        (node as ExprStruct).name.kind == ODot ? "" : " ",
        sb("args"),
      ]
    }
    case StructArg: {
      const self = node as StructArg
      if (self.colon) {
        let e = self.expr
        if (e) {
          while (e instanceof ExprParen) {
            e = e.of.value
          }
          if (e instanceof ExprVar && e.args == null && e.targs == null) {
            if (e.name.val == self.name.val) {
              return sb("name")
            }
          }
        }

        return [sb("name"), sb("colon"), " ", sb.paren("expr")]
      } else {
        return sb("name")
      }
    }
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
    case ForHeaders:
      ;(node as ForHeaders).items.map(
        (x, i, a) => (x.sources.spaceAfter = i == a.length - 1),
      )
      return group([
        indent([
          softline,
          join([";", line], sb.all("items")),
          ifBreak([";"], ""),
        ]),
        softline,
      ])
    case ForHeader:
      return [sb("bound"), sb("eq"), " ", sb("sources")]
    case ExprFor:
      return [sb.opt("label"), sb("kw"), " ", sb("headers"), sb("block")]
    case Label:
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
        sb.opt("eq"),
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
      return [
        sb("kw"),
        " ",
        sb.as("name", () => join(", ", sb.all("items"))),
        sb.opt("tparams"),
        " ",
        sb("fields"),
      ]
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
          sb.as("sizes", () => fill(join([",", line], sb.all("items")))),
        ]),
        softline,
        sb.sub("brack", "gt"),
      ])
    }
    case StmtLet:
    case ItemLet:
      return [
        sb("kw"),
        (node as StmtLet).mut ? " " : "",
        sb.opt("mut"),
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
        sb.opt("as"),
        " ",
        sb("label"),
        sb.alt("semi", ";"),
      ]
    case ExposeLet:
      return [
        sb("kw"),
        " ",
        sb("name"),
        sb.opt("as"),
        " ",
        sb("label"),
        sb.opt("colon"),
        sb.opt("type"),
        " ",
        sb("eq"),
        " ",
        sb.paren("value"),
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
    case PatIgnore:
      return sb("name")
    case ItemComment:
    case StmtComment:
      return sb("of")
    case Comments:
      return join(
        hardline,
        (node as Comments).tokens.map((x, i, a) => {
          const sepPrev =
            i > 0 &&
            x.info.source.slice(a[i - 1]!.end, x.start).includes("\n\n")
          const suffix = lineSuffix("//" + x.val.slice(2).trimEnd())
          if (sepPrev) {
            return [hardline, suffix]
          } else {
            return suffix
          }
        }),
      )
    case TypeAlt:
      return [sb("lhs"), " ", sb("op"), " ", sb("rhs")]
    case ItemTypeAlias:
      if (!(node as ItemTypeAlias).eq) {
        return [sb("kw"), " ", sb("ident"), sb.alt("semi", ";")]
      }
      return [
        sb("kw"),
        " ",
        sb("ident"),
        " ",
        sb("eq"),
        " ",
        sb.paren("of"),
        sb.alt("semi", ";"),
      ]
    case TypeSyntax:
      return [sb("kw")]
    case TypeAny:
      return [sb("kw"), " ", sb("of")]
    case TypeArrayUnsized:
      return sb("of")
    case FnReturnTypeTypeof:
      return [sb("arrow"), " ", sb("kw"), " ", sb("into")]
  }

  throw new Error(
    `Cannot print ${node.constructor.name} '${sb.source.slice(node.start, node.end)}'.`,
  )
}
