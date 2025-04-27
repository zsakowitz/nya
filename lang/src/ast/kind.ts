export const TIdent = 1 // f32, Complex, %"\odot"
export const TDeriv = 2 // d/dx, d/dwrt, d/dy
export const TDerivIgnore = 3 // d/d_
export const TBuiltin = 4 // @vec2, @meter
export const TLabel = 5 // 'hello, 'meter
export const TIgnore = 6 // _

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

// operators prefixed with @
export const APlus = 42
export const AMinus = 43
export const AStar = 44
export const ASlash = 45
export const AStarStar = 46
export const ATilde = 47
export const ABar = 48
export const AAmp = 49
export const ABarBar = 50
export const AAmpAmp = 51
export const AAt = 52
export const ABackslash = 53
export const AEqEq = 54
export const ANe = 55
export const ALe = 56
export const AGe = 57
export const ALt = 58
export const AGt = 59
export const ABang = 60
export const ALParen = 61
export const ARParen = 62
export const ALBrack = 63
export const ARBrack = 64
export const ALBrace = 65
export const ARBrace = 66
export const ALAngle = 67
export const ARAngle = 68
export const ALInterp = 69
export const ASemi = 70
export const AComma = 71
export const AColon = 72
export const AArrowRet = 73
export const AArrowMap = 74
export const AColonColon = 75
export const ADot = 76
export const ADotDot = 77
export const APercent = 78
export const AEq = 79

// operators not prefixed with @
export const OPlus = 80
export const OMinus = 81
export const OStar = 82
export const OSlash = 83
export const OStarStar = 84
export const OTilde = 85
export const OBar = 86
export const OAmp = 87
export const OBarBar = 88
export const OAmpAmp = 89
export const OAt = 90
export const OBackslash = 91
export const OEqEq = 92
export const ONe = 93
export const OLe = 94
export const OGe = 95
export const OLt = 96
export const OGt = 97
export const OBang = 98
export const OLParen = 99
export const ORParen = 100
export const OLBrack = 101
export const ORBrack = 102
export const OLBrace = 103
export const ORBrace = 104
export const OLAngle = 105
export const ORAngle = 106
export const OLInterp = 107
export const OSemi = 108
export const OComma = 109
export const OColon = 110
export const OArrowRet = 111
export const OArrowMap = 112
export const OColonColon = 113
export const ODot = 114
export const ODotDot = 115
export const OPercent = 116
export const OEq = 117

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
