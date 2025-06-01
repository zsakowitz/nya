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
export const KMut = 44
export const KSyntax = 45
export const KIs = 46
export const KAny = 47
export const KTypeof = 48
export const KMap = 49
export const KCall = 50

// operators prefixed with @
export const APlus = 51
export const AMinus = 52
export const AMinusUnary = 53 // replaces AMinus if in an ExprUnary
export const AStar = 54
export const ASlash = 55
export const AStarStar = 56
export const ATildeUnary = 57
export const ABar = 58
export const AAmp = 59
export const ABarBar = 60
export const AAmpAmp = 61
export const AAt = 62
export const ABackslash = 63
export const AEqEq = 64
export const ANe = 65
export const ALe = 66
export const AGe = 67
export const ALt = 68
export const AGt = 69
export const ABangUnary = 70
export const ALParen = 71
export const ARParen = 72
export const ALBrack = 73
export const ARBrack = 74
export const ALBrace = 75
export const ARBrace = 76
export const ALAngle = 77
export const ARAngle = 78
export const ALInterp = 79
export const ASemi = 80
export const AComma = 81
export const AColon = 82
export const AArrowRet = 83
export const AArrowMap = 84
export const AColonColon = 85
export const ADot = 86
export const ADotDot = 87
export const APercent = 88
export const AEq = 89
export const ATildeEq = 90
export const AHash = 91

// operators not prefixed with @
export const OPlus = 92
export const OMinus = 93
export const OMinusUnary = 94 // replaces OMinus if in an ExprUnary
export const OStar = 95
export const OSlash = 96
export const OStarStar = 97
export const OTildeUnary = 98
export const OBar = 99
export const OAmp = 100
export const OBarBar = 101
export const OAmpAmp = 102
export const OAt = 103
export const OBackslash = 104
export const OEqEq = 105
export const ONe = 106
export const OLe = 107
export const OGe = 108
export const OLt = 109
export const OGt = 110
export const OBangUnary = 111
export const OLParen = 112
export const ORParen = 113
export const OLBrack = 114
export const ORBrack = 115
export const OLBrace = 116
export const ORBrace = 117
export const OLAngle = 118
export const ORAngle = 119
export const OLInterp = 120
export const OSemi = 121
export const OComma = 122
export const OColon = 123
export const OArrowRet = 124
export const OArrowMap = 125
export const OColonColon = 126
export const ODot = 127
export const ODotDot = 128
export const OPercent = 129
export const OEq = 130
export const OTildeEq = 131
export const OHash = 132
export const ODotDotDot = 133

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
  mut: KMut,
  syntax: KSyntax,
  is: KIs,
  any: KAny,
  typeof: KTypeof,
  map: KMap,
  call: KCall,
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

export const AVERLOADABLE = [
  APlus, // add
  AMinus, // subtract
  AStar, // multiply
  ASlash, // divide
  AHash, // matrix multiplication
  AStarStar, // exponentiate
  ATildeUnary, // idk, but maybe useful
  ABar, // union
  AAmp, // intersection
  ABarBar, // or
  AAmpAmp, // and
  ABackslash, // fraction
  AEqEq, // eq
  ANe, // ne
  ALe, // le
  AGe, // ge
  ALt, // lt
  AGt, // gt
  ABangUnary, // not
  AArrowRet, // type conversion
  APercent, // modulus
  ATildeEq, // approximate eq
] as const

export type OOverloadable = (typeof OVERLOADABLE)[number]
export type AOverloadable = (typeof AVERLOADABLE)[number]

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
  [KSyntax]: "syntax",
  [KIs]: "is",
  [KAny]: "any",
  [KTypeof]: "typeof",
  [KMap]: "map",
  [KCall]: "call",
  [ODotDotDot]: "...",
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

export function doesIdentNeedEscaping(name: string): boolean {
  return !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || name in KWS
}

export function escapeIdentName(name: string, allowOperators: boolean): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    if (name in KWS) {
      return "%" + name
    } else {
      return name
    }
  }

  if (
    allowOperators &&
    name in OPS &&
    OVERLOADABLE.includes(OPS[name] as any)
  ) {
    return name
  }

  return `%"${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}
