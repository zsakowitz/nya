export const TIdent = 1 // f32, Complex
export const TBuiltin = 2 // @vec2, @meter
export const TLabel = 3 // 'hello, 'meter
export const TIgnore = 4 // _

export const TInt = 5 // 2
export const TFloat = 6 // 2.3
export const TSym = 7 // :hello, :meter
export const TString = 8 // "hello"

export const TComment = 9 // // world
export const TSource = 10 // anything inside a source block

// keywords
export const KIf = 11
export const KElse = 12
export const KFor = 13
export const KMatch = 14
export const KDeriv = 15
export const KSimplify = 16
export const KExpose = 17
export const KType = 18
export const KFn = 19
export const KStruct = 20
export const KOpaque = 21
export const KLet = 22
export const KIn = 23
export const KEnum = 24
export const KSyntax = 25
export const KReturn = 26
export const KBreak = 27
export const KContinue = 28
export const KUse = 29
export const KVal = 30
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
export const ALInterp = 60
export const ASemi = 61
export const AComma = 62
export const AColon = 63
export const AArrowRet = 64
export const AArrowMap = 65
export const AColonColon = 66
export const ADot = 67
export const ADotDot = 68
export const AEq = 69

// operators not prefixed with @
export const OPlus = 70
export const OMinus = 71
export const OStar = 72
export const OSlash = 73
export const OStarStar = 74
export const OTilde = 75
export const OBar = 76
export const OAmp = 77
export const OBarBar = 78
export const OAmpAmp = 79
export const OAt = 80
export const OBackslash = 81
export const OEqEq = 82
export const ONe = 83
export const OLe = 84
export const OGe = 85
export const OLt = 86
export const OGt = 87
export const OBang = 88
export const OLParen = 89
export const ORParen = 90
export const OLBrack = 91
export const ORBrack = 92
export const OLBrace = 93
export const ORBrace = 94
export const OLInterp = 95
export const OSemi = 96
export const OComma = 97
export const OColon = 98
export const OArrowRet = 99
export const OArrowMap = 100
export const OColonColon = 101
export const ODot = 102
export const ODotDot = 103
export const OEq = 104

export type KindL =
  | typeof OLParen
  | typeof OLBrack
  | typeof OLBrace
  | typeof OLt
  | typeof OLInterp

export const KWS: Record<string, number> = {
  if: KIf,
  else: KElse,
  for: KFor,
  match: KMatch,
  deriv: KDeriv,
  simplify: KSimplify,
  expose: KExpose,
  type: KType,
  fn: KFn,
  struct: KStruct,
  opaque: KOpaque,
  let: KLet,
  in: KIn,
  enum: KEnum,
  syntax: KSyntax,
  return: KReturn,
  break: KBreak,
  continue: KContinue,
  use: KUse,
  val: KVal,
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
  "=": OEq,
}

export const MATCHING_PAREN: Record<KindL, number> = {
  [OLParen]: ORParen,
  [OLBrack]: ORBrack,
  [OLBrace]: ORBrace,
  [OLt]: OGt,
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
