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
export const KLocal = 0

// operators prefixed with @
export const APlus = 42
export const AMinus = 43
export const AMinusUnary = 44 // replaces AMinus if in an ExprUnary
export const AStar = 45
export const ASlash = 46
export const AStarStar = 47
export const ATildeUnary = 48
export const ABar = 49
export const AAmp = 50
export const ABarBar = 51
export const AAmpAmp = 52
export const AAt = 53
export const ABackslash = 54
export const AEqEq = 55
export const ANe = 56
export const ALe = 57
export const AGe = 58
export const ALt = 59
export const AGt = 60
export const ABangUnary = 61
export const ALParen = 62
export const ARParen = 63
export const ALBrack = 64
export const ARBrack = 65
export const ALBrace = 66
export const ARBrace = 67
export const ALAngle = 68
export const ARAngle = 69
export const ALInterp = 70
export const ASemi = 71
export const AComma = 72
export const AColon = 73
export const AArrowRet = 74
export const AArrowMap = 75
export const AColonColon = 76
export const ADot = 77
export const ADotDot = 78
export const APercent = 79
export const AEq = 80

// operators not prefixed with @
export const OPlus = 81
export const OMinus = 82
export const OMinusUnary = 83 // replaces OMinus if in an ExprUnary
export const OStar = 84
export const OSlash = 85
export const OStarStar = 86
export const OTildeUnary = 87
export const OBar = 88
export const OAmp = 89
export const OBarBar = 90
export const OAmpAmp = 91
export const OAt = 92
export const OBackslash = 93
export const OEqEq = 94
export const ONe = 95
export const OLe = 96
export const OGe = 97
export const OLt = 98
export const OGt = 99
export const OBangUnary = 100
export const OLParen = 101
export const ORParen = 102
export const OLBrack = 103
export const ORBrack = 104
export const OLBrace = 105
export const ORBrace = 106
export const OLAngle = 107
export const ORAngle = 108
export const OLInterp = 109
export const OSemi = 110
export const OComma = 111
export const OColon = 112
export const OArrowRet = 113
export const OArrowMap = 114
export const OColonColon = 115
export const ODot = 116
export const ODotDot = 117
export const OPercent = 118
export const OEq = 119

export type Brack =
  | typeof OLParen
  | typeof OLBrack
  | typeof OLBrace
  | typeof OLAngle
  | typeof OLInterp

export const KWS: Record<string, number> = {
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
}

export const APS: Record<string, number> = {
  "+": APlus,
  "-": AMinus,
  "*": AStar,
  "/": ASlash,
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
  "+": OPlus,
  "-": OMinus,
  "*": OStar,
  "/": OSlash,
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

export const MATCHING_PAREN: Record<Brack, number> = {
  [OLParen]: ORParen,
  [OLBrack]: ORBrack,
  [OLBrace]: ORBrace,
  [OLAngle]: ORAngle,
  [OLInterp]: ORParen,
}

export const OPS_AND_SECOND_CHARS: Record<string, string[]> =
  Object.create(null)

for (const op in OPS) {
  switch (op.length) {
    case 1:
      OPS_AND_SECOND_CHARS[op] ??= []
      break
    case 2:
      ;(OPS_AND_SECOND_CHARS[op[0]!] ??= []).push(op[1]!)
      break
  }
}

export const IDENT_PREFIXES: Record<string, number> = {
  ":": TSym,
  "@": TBuiltin,
  "'": TLabel,
  "$": TParam,
}

export const OVERLOADABLE = Object.freeze([
  OPlus, // add
  OMinus, // subtract
  OStar, // multiple
  OSlash, // divide
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
  OBangUnary, // nots
  OArrowRet, // type conversion
  OPercent, // modulus
] as const)

export type OOverloadable = (typeof OVERLOADABLE)[number]

export const OP_TEXT = {
  [OPlus]: "+",
  [APlus]: "@+",
  [OMinus]: "-",
  [OMinusUnary]: "-",
  [AMinus]: "@-",
  [AMinusUnary]: "@-",
  [OStar]: "*",
  [AStar]: "@*",
  [OSlash]: "/",
  [ASlash]: "@/",
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
}
