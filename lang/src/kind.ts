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
export const KAs = 32
export const KOnly = 33
export const KSource = 34
export const KRef = 35

// operators prefixed with @
export const APlus = 36
export const AMinus = 37
export const AStar = 38
export const ASlash = 39
export const AStarStar = 40
export const ATilde = 41
export const ABar = 42
export const AAmp = 43
export const ABarBar = 44
export const AAmpAmp = 45
export const AAt = 46
export const ABackslash = 47
export const AEqEq = 48
export const ANe = 49
export const ALe = 50
export const AGe = 51
export const ALt = 52
export const AGt = 53
export const ABang = 54
export const ALParen = 55
export const ARParen = 56
export const ALBrack = 57
export const ARBrack = 58
export const ALBrace = 59
export const ARBrace = 60
export const ALAngle = 61
export const ARAngle = 62
export const ALInterp = 63
export const ASemi = 64
export const AComma = 65
export const AColon = 66
export const AArrowRet = 67
export const AArrowMap = 68
export const AColonColon = 69
export const ADot = 70
export const ADotDot = 71
export const APercent = 72
export const AEq = 73

// operators not prefixed with @
export const OPlus = 74
export const OMinus = 75
export const OStar = 76
export const OSlash = 77
export const OStarStar = 78
export const OTilde = 79
export const OBar = 80
export const OAmp = 81
export const OBarBar = 82
export const OAmpAmp = 83
export const OAt = 84
export const OBackslash = 85
export const OEqEq = 86
export const ONe = 87
export const OLe = 88
export const OGe = 89
export const OLt = 90
export const OGt = 91
export const OBang = 92
export const OLParen = 93
export const ORParen = 94
export const OLBrack = 95
export const ORBrack = 96
export const OLBrace = 97
export const ORBrace = 98
export const OLAngle = 99
export const ORAngle = 100
export const OLInterp = 101
export const OSemi = 102
export const OComma = 103
export const OColon = 104
export const OArrowRet = 105
export const OArrowMap = 106
export const OColonColon = 107
export const ODot = 108
export const ODotDot = 109
export const OPercent = 110
export const OEq = 111

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
