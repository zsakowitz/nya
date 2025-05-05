export const TIdent = 1 // f32, Complex, %"\odot"
export const TDeriv = 2 // d/dx, d/dwrt, d/dy
export const TDerivIgnore = 3 // d/d_
export const TBuiltin = 4 // @vec2, @meter
export const TLabel = 5 // 'hello, 'meter
export const TIgnore = 6 // _
export const TParam = 7 // $x, $a, $_

export const TInt = 8 // 2
export const TFloat = 9 // 2.3
export const TSym = 10 // :hello, :meter
export const TString = 11 // "hello"

export const TComment = 12 // // world
export const TSource = 13 // anything inside a source block

// keywords
export const KIf = 14
export const KElse = 15
export const KFor = 16
export const KMatch = 17
export const KRule = 18
export const KExpose = 19
export const KType = 20
export const KFn = 21
export const KStruct = 22
export const KOpaque = 23
export const KLet = 24
export const KIn = 25
export const KEnum = 26
export const KReturn = 27
export const KBreak = 28
export const KContinue = 29
export const KUse = 30
export const KUsage = 31
export const KAs = 32
export const KOnly = 33
export const KSource = 34
export const KData = 35
export const KRef = 36
export const KAssert = 37
export const KRaise = 38
export const KConst = 39
export const KTrue = 40
export const KFalse = 41
export const KLocal = 42
export const KMatrix = 43

// operators prefixed with @
export const APlus = 45
export const AMinus = 46
export const AMinusUnary = 47 // replaces AMinus if in an ExprUnary
export const AStar = 48
export const ASlash = 49
export const AStarStar = 50
export const ATildeUnary = 51
export const ABar = 52
export const AAmp = 53
export const ABarBar = 54
export const AAmpAmp = 55
export const AAt = 56
export const ABackslash = 57
export const AEqEq = 58
export const ANe = 59
export const ALe = 60
export const AGe = 61
export const ALt = 62
export const AGt = 63
export const ABangUnary = 64
export const ALParen = 65
export const ARParen = 66
export const ALBrack = 67
export const ARBrack = 68
export const ALBrace = 69
export const ARBrace = 70
export const ALAngle = 71
export const ARAngle = 72
export const ALInterp = 73
export const ASemi = 74
export const AComma = 75
export const AColon = 76
export const AArrowRet = 77
export const AArrowMap = 78
export const AColonColon = 79
export const ADot = 80
export const ADotDot = 81
export const APercent = 82
export const AEq = 83
export const ATildeEq = 124
export const AHash = 128

// operators not prefixed with @
export const OPlus = 84
export const OMinus = 85
export const OMinusUnary = 86 // replaces OMinus if in an ExprUnary
export const OStar = 87
export const OSlash = 88
export const OStarStar = 89
export const OTildeUnary = 90
export const OBar = 91
export const OAmp = 92
export const OBarBar = 93
export const OAmpAmp = 94
export const OAt = 95
export const OBackslash = 96
export const OEqEq = 97
export const ONe = 98
export const OLe = 99
export const OGe = 100
export const OLt = 101
export const OGt = 102
export const OBangUnary = 103
export const OLParen = 104
export const ORParen = 105
export const OLBrack = 106
export const ORBrack = 107
export const OLBrace = 108
export const ORBrace = 109
export const OLAngle = 110
export const ORAngle = 111
export const OLInterp = 112
export const OSemi = 113
export const OComma = 114
export const OColon = 115
export const OArrowRet = 116
export const OArrowMap = 117
export const OColonColon = 118
export const ODot = 119
export const ODotDot = 120
export const OPercent = 121
export const OEq = 122
export const OTildeEq = 123
export const OHash = 127

export type Brack =
  | typeof OLParen
  | typeof OLBrack
  | typeof OLBrace
  | typeof OLAngle
  | typeof OLInterp

export const KWS: Record<string, number> = {
  // @ts-ignore
  __proto__: null,
  if: KIf,
  else: KElse,
  for: KFor,
  match: KMatch,
  rule: KRule,
  expose: KExpose,
  type: KType,
  fn: KFn,
  struct: KStruct,
  opaque: KOpaque,
  let: KLet,
  in: KIn,
  enum: KEnum,
  return: KReturn,
  break: KBreak,
  continue: KContinue,
  use: KUse,
  usage: KUsage,
  as: KAs,
  only: KOnly,
  source: KSource,
  data: KData,
  ref: KRef,
  assert: KAssert,
  raise: KRaise,
  const: KConst,
  true: KTrue,
  false: KFalse,
  local: KLocal,
  matrix: KMatrix,
  _: TIgnore,
}

export const APS: Record<string, number> = {
  // @ts-ignore
  __proto__: null,
  "+": APlus,
  "-": AMinus,
  "*": AStar,
  "/": ASlash,
  "#": AHash,
  "**": AStarStar,
  "~": ATildeUnary,
  "|": ABar,
  "&": AAmp,
  "||": ABarBar,
  "&&": AAmpAmp,
  "@": AAt,
  "\\": ABackslash,
  "==": AEqEq,
  "!=": ANe,
  "<=": ALe,
  ">=": AGe,
  "<": ALt,
  ">": AGt,
  "~=": ATildeEq,
  "!": ABangUnary,
  "(": ALParen,
  ")": ARParen,
  "[": ALBrack,
  "]": ARBrack,
  "{": ALBrace,
  "}": ARBrace,
  "$(": ALInterp,
  ";": ASemi,
  ",": AComma,
  ":": AColon,
  "->": AArrowRet,
  "=>": AArrowMap,
  "::": AColonColon,
  ".": ADot,
  "..": ADotDot,
  "%": APercent,
  "=": AEq,
}

export const OPS: Record<string, number> = {
  // @ts-ignore
  __proto__: null,
  "+": OPlus,
  "-": OMinus,
  "*": OStar,
  "/": OSlash,
  "#": OHash,
  "**": OStarStar,
  "~": OTildeUnary,
  "|": OBar,
  "&": OAmp,
  "||": OBarBar,
  "&&": OAmpAmp,
  "@": OAt,
  "\\": OBackslash,
  "==": OEqEq,
  "!=": ONe,
  "<=": OLe,
  ">=": OGe,
  "<": OLt,
  ">": OGt,
  "~=": OTildeEq,
  "!": OBangUnary,
  "(": OLParen,
  ")": ORParen,
  "[": OLBrack,
  "]": ORBrack,
  "{": OLBrace,
  "}": ORBrace,
  "$(": OLInterp,
  ";": OSemi,
  ",": OComma,
  ":": OColon,
  "->": OArrowRet,
  "=>": OArrowMap,
  "::": OColonColon,
  ".": ODot,
  "..": ODotDot,
  "%": OPercent,
  "=": OEq,
}

export const EXPORTED_ALTS: Record<number, string> = {
  // @ts-ignore
  __proto__: null,
  [OPlus]: "_add",
  [OMinus]: "_sub",
  [OStar]: "_prod",
  [OSlash]: "_div",
  [OHash]: "_hash",
  [OStarStar]: "_pow",
  [OTildeUnary]: "_tilde",
  [OBar]: "_bar",
  [OAmp]: "_amp",
  [OBarBar]: "_or",
  [OAmpAmp]: "_and",
  [OBackslash]: "_over",
  [OEqEq]: "_eq",
  [ONe]: "_ne",
  [OLe]: "_le",
  [OGe]: "_ge",
  [OLt]: "_lt",
  [OGt]: "_gt",
  [OTildeEq]: "_approxeq",
  [OBangUnary]: "_not",
  [OArrowRet]: "_cast",
  [OPercent]: "_mod",
} satisfies Record<OOverloadable, string>

export const MATCHING_PAREN: Record<Brack, number> = {
  // @ts-ignore
  __proto__: null,
  [OLParen]: ORParen,
  [OLBrack]: ORBrack,
  [OLBrace]: ORBrace,
  [OLAngle]: ORAngle,
  [OLInterp]: ORParen,
}

export const OPS_AND_SECOND_CHARS: Record<number, Set<number>> = Object.create(
  null,
)

for (const op in OPS) {
  switch (op.length) {
    case 1:
      OPS_AND_SECOND_CHARS[op.charCodeAt(0)] ??= new Set()
      break
    case 2:
      ;(OPS_AND_SECOND_CHARS[op.charCodeAt(0)] ??= new Set()).add(
        op.charCodeAt(1),
      )
      break
  }
}

export const IDENT_PREFIXES: Record<number, number> = {
  // @ts-ignore
  __proto__: null,
  [":".charCodeAt(0)]: TSym,
  ["@".charCodeAt(0)]: TBuiltin,
  ["'".charCodeAt(0)]: TLabel,
  ["$".charCodeAt(0)]: TParam,
}

export const OVERLOADABLE = [
  OPlus, // add
  OMinus, // subtract
  OStar, // multiply
  OSlash, // divide
  OHash, // matrix multiplication
  OStarStar, // exponentiate
  OTildeUnary, // idk, but maybe useful
  OBar, // union
  OAmp, // intersection
  OBarBar, // or
  OAmpAmp, // and
  OBackslash, // fraction
  OEqEq, // eq
  ONe, // ne
  OLe, // le
  OGe, // ge
  OLt, // lt
  OGt, // gt
  OBangUnary, // not
  OArrowRet, // type conversion
  OPercent, // modulus
  OTildeEq, // approximate eq
] as const

export type OOverloadable = (typeof OVERLOADABLE)[number]

export const OP_TEXT: Record<number, string> = {
  // @ts-ignore
  __proto__: null,
  [OPlus]: "+",
  [APlus]: "@+",
  [OMinus]: "-",
  [AMinus]: "@-",
  [OMinusUnary]: "-",
  [AMinusUnary]: "@-",
  [OStar]: "*",
  [AStar]: "@*",
  [OSlash]: "/",
  [ASlash]: "@/",
  [OHash]: "#",
  [AHash]: "@#",
  [OStarStar]: "**",
  [AStarStar]: "@**",
  [OTildeUnary]: "~",
  [ATildeUnary]: "@~",
  [OBar]: "|",
  [ABar]: "@|",
  [OAmp]: "&",
  [AAmp]: "@&",
  [OBarBar]: "||",
  [ABarBar]: "@||",
  [OAmpAmp]: "&&",
  [AAmpAmp]: "@&&",
  [OAt]: "@",
  [AAt]: "@@",
  [OBackslash]: "\\",
  [ABackslash]: "@\\",
  [OEqEq]: "==",
  [AEqEq]: "@==",
  [ONe]: "!=",
  [ANe]: "@!=",
  [OLe]: "<=",
  [ALe]: "@<=",
  [OGe]: ">=",
  [AGe]: "@>=",
  [OLt]: "<",
  [ALt]: "@<",
  [OGt]: ">",
  [AGt]: "@>",
  [OBangUnary]: "!",
  [ABangUnary]: "@!",
  [OLParen]: "(",
  [ALParen]: "@(",
  [ORParen]: ")",
  [ARParen]: "@)",
  [OLBrack]: "[",
  [ALBrack]: "@[",
  [ORBrack]: "]",
  [ARBrack]: "@]",
  [OLBrace]: "{",
  [ALBrace]: "@{",
  [ORBrace]: "}",
  [ARBrace]: "@}",
  [OLInterp]: "$(",
  [ALInterp]: "@$(",
  [OSemi]: ";",
  [ASemi]: "@;",
  [OComma]: ",",
  [AComma]: "@,",
  [OColon]: ":",
  [AColon]: "@:",
  [OArrowRet]: "->",
  [AArrowRet]: "@->",
  [OArrowMap]: "=>",
  [AArrowMap]: "@=>",
  [OColonColon]: "::",
  [AColonColon]: "@::",
  [ODot]: ".",
  [ADot]: "@.",
  [ODotDot]: "..",
  [ADotDot]: "@..",
  [OPercent]: "%",
  [APercent]: "@%",
  [OEq]: "=",
  [AEq]: "@=",
  [OTildeEq]: "~=",
  [ATildeEq]: "@~=",
  [KIf]: "if",
  [KElse]: "else",
  [KFor]: "for",
  [KMatch]: "match",
  [KRule]: "rule",
  [KExpose]: "expose",
  [KType]: "type",
  [KFn]: "fn",
  [KStruct]: "struct",
  [KOpaque]: "opaque",
  [KLet]: "let",
  [KIn]: "in",
  [KEnum]: "enum",
  [KReturn]: "return",
  [KBreak]: "break",
  [KContinue]: "continue",
  [KUse]: "use",
  [KUsage]: "usage",
  [KAs]: "as",
  [KOnly]: "only",
  [KSource]: "source",
  [KData]: "data",
  [KRef]: "ref",
  [KAssert]: "assert",
  [KRaise]: "raise",
  [KConst]: "const",
  [KTrue]: "true",
  [KFalse]: "false",
  [KLocal]: "local",
  [KMatrix]: "matrix",
}

Object.freeze(KWS)
Object.freeze(APS)
Object.freeze(OPS)
Object.freeze(EXPORTED_ALTS)
Object.freeze(MATCHING_PAREN)
Object.freeze(OPS_AND_SECOND_CHARS)
Object.freeze(IDENT_PREFIXES)
Object.freeze(OVERLOADABLE)
Object.freeze(OP_TEXT)
