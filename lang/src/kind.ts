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

// operators prefixed with @
export const APlus = 34
export const AMinus = 35
export const AStar = 36
export const ASlash = 37
export const AStarStar = 38
export const ATilde = 39
export const ABar = 40
export const AAmp = 41
export const ABarBar = 42
export const AAmpAmp = 43
export const AAt = 44
export const ABackslash = 45
export const AEqEq = 46
export const ANe = 47
export const ALe = 48
export const AGe = 49
export const ALt = 50
export const AGt = 51
export const ABang = 52
export const ALParen = 53
export const ARParen = 54
export const ALBrack = 55
export const ARBrack = 56
export const ALBrace = 57
export const ARBrace = 58
export const ALInterp = 59
export const ASemi = 60
export const AComma = 61
export const AColon = 62
export const AArrowRet = 63
export const AArrowMap = 64
export const AColonColon = 65
export const ADot = 66
export const ADotDot = 67
export const AEq = 68

// operators not prefixed with @
export const OPlus = 69
export const OMinus = 70
export const OStar = 71
export const OSlash = 72
export const OStarStar = 73
export const OTilde = 74
export const OBar = 75
export const OAmp = 76
export const OBarBar = 77
export const OAmpAmp = 78
export const OAt = 79
export const OBackslash = 80
export const OEqEq = 81
export const ONe = 82
export const OLe = 83
export const OGe = 84
export const OLt = 85
export const OGt = 86
export const OBang = 87
export const OLParen = 88
export const ORParen = 89
export const OLBrack = 90
export const ORBrack = 91
export const OLBrace = 92
export const ORBrace = 93
export const OLInterp = 94
export const OSemi = 95
export const OComma = 96
export const OColon = 97
export const OArrowRet = 98
export const OArrowMap = 99
export const OColonColon = 100
export const ODot = 101
export const ODotDot = 102
export const OEq = 103

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
