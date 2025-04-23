export const TIdent = 1 // f32, Complex
export const TDeriv = 2 // d/dx, d/dwrt, d/dy
export const TDerivIgnore = 3 // d/d_
export const TBuiltin = 4 // @vec2, @meter
export const TLabel = 5 // 'hello, 'meter
export const TIgnore = 6 // _

export const TInt = 7 // 2
export const TFloat = 8 // 2.3
export const TSym = 9 // :hello, :meter
export const TString = 10 // "hello"

export const TComment = 11 // // world
export const TSource = 12 // anything inside a source block

// keywords
export const KIf = 13
export const KElse = 14
export const KFor = 15
export const KMatch = 16
export const KRule = 17
export const KExpose = 18
export const KType = 19
export const KFn = 20
export const KStruct = 21
export const KOpaque = 22
export const KLet = 23
export const KIn = 24
export const KEnum = 25
export const KReturn = 26
export const KBreak = 27
export const KContinue = 28
export const KUse = 29
export const KUsage = 31
export const KOnly = 32
export const KSource = 33
export const KRef = 34

// operators prefixed with @
export const APlus = 35
export const AMinus = 36
export const AStar = 37
export const ASlash = 38
export const AStarStar = 39
export const ATilde = 40
export const ABar = 41
export const AAmp = 42
export const ABarBar = 43
export const AAmpAmp = 44
export const AAt = 45
export const ABackslash = 46
export const AEqEq = 47
export const ANe = 48
export const ALe = 49
export const AGe = 50
export const ALt = 51
export const AGt = 52
export const ABang = 53
export const ALParen = 54
export const ARParen = 55
export const ALBrack = 56
export const ARBrack = 57
export const ALBrace = 58
export const ARBrace = 59
export const ALAngle = 60
export const ARAngle = 61
export const ALInterp = 62
export const ASemi = 63
export const AComma = 64
export const AColon = 65
export const AArrowRet = 66
export const AArrowMap = 67
export const AColonColon = 68
export const ADot = 69
export const ADotDot = 70
export const APercent = 71
export const AEq = 72

// operators not prefixed with @
export const OPlus = 73
export const OMinus = 74
export const OStar = 75
export const OSlash = 76
export const OStarStar = 77
export const OTilde = 78
export const OBar = 79
export const OAmp = 80
export const OBarBar = 81
export const OAmpAmp = 82
export const OAt = 83
export const OBackslash = 84
export const OEqEq = 85
export const ONe = 86
export const OLe = 87
export const OGe = 88
export const OLt = 89
export const OGt = 90
export const OBang = 91
export const OLParen = 92
export const ORParen = 93
export const OLBrack = 94
export const ORBrack = 95
export const OLBrace = 96
export const ORBrace = 97
export const OLAngle = 98
export const ORAngle = 99
export const OLInterp = 100
export const OSemi = 101
export const OComma = 102
export const OColon = 103
export const OArrowRet = 104
export const OArrowMap = 105
export const OColonColon = 106
export const ODot = 107
export const ODotDot = 108
export const OPercent = 109
export const OEq = 110

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
  only: KOnly,
  source: KSource,
  ref: KRef,
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
