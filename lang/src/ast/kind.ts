export const TIdent = 1 // f32, Complex
export const TDeriv = 2 // d/dx, d/dwrt, d/dy
export const TDerivIgnore = 3 // d/d_
export const TBuiltin = 4 // @vec2, @meter
export const TLabel = 5 // 'hello, 'meter
export const TIgnore = 6 // _
export const TProp = 7 // .x, .y, .z

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

// operators prefixed with @
export const APlus = 39
export const AMinus = 40
export const AStar = 41
export const ASlash = 42
export const AStarStar = 43
export const ATilde = 44
export const ABar = 45
export const AAmp = 46
export const ABarBar = 47
export const AAmpAmp = 48
export const AAt = 49
export const ABackslash = 50
export const AEqEq = 51
export const ANe = 52
export const ALe = 53
export const AGe = 54
export const ALt = 55
export const AGt = 56
export const ABang = 57
export const ALParen = 58
export const ARParen = 59
export const ALBrack = 60
export const ARBrack = 61
export const ALBrace = 62
export const ARBrace = 63
export const ALAngle = 64
export const ARAngle = 65
export const ALInterp = 66
export const ASemi = 67
export const AComma = 68
export const AColon = 69
export const AArrowRet = 70
export const AArrowMap = 71
export const AColonColon = 72
export const ADot = 73
export const ADotDot = 74
export const APercent = 75
export const AEq = 76

// operators not prefixed with @
export const OPlus = 77
export const OMinus = 78
export const OStar = 79
export const OSlash = 80
export const OStarStar = 81
export const OTilde = 82
export const OBar = 83
export const OAmp = 84
export const OBarBar = 85
export const OAmpAmp = 86
export const OAt = 87
export const OBackslash = 88
export const OEqEq = 89
export const ONe = 90
export const OLe = 91
export const OGe = 92
export const OLt = 93
export const OGt = 94
export const OBang = 95
export const OLParen = 96
export const ORParen = 97
export const OLBrack = 98
export const ORBrack = 99
export const OLBrace = 100
export const ORBrace = 101
export const OLAngle = 102
export const ORAngle = 103
export const OLInterp = 104
export const OSemi = 105
export const OComma = 106
export const OColon = 107
export const OArrowRet = 108
export const OArrowMap = 109
export const OColonColon = 110
export const ODot = 111
export const ODotDot = 112
export const OPercent = 113
export const OEq = 114

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
}

export const APS: Record<string, number> = {
  "+": APlus,
  "-": AMinus,
  "*": AStar,
  "/": ASlash,
  "**": AStarStar,
  "~": ATilde,
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
  "!": ABang,
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
  "~": OTilde,
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
  "!": OBang,
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
  "%": TIdent,
  ".": TProp,
}

export const OVERLOADABLE = Object.freeze([
  OPlus, // add
  OMinus, // subtract
  OStar, // multiple
  OSlash, // divide
  OStarStar, // exponentiate
  OTilde, // idk, but maybe useful
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
  OBang, // nots
  OArrowRet, // type conversion
  OPercent, // modulus
] as const)

export type OOverloadable = (typeof OVERLOADABLE)[number]
