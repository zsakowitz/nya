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
export const KStruct = 23
export const KOpaque = 24
export const KLet = 25
export const KIn = 26
export const KEnum = 27
export const KReturn = 28
export const KBreak = 29
export const KContinue = 30
export const KUse = 31
export const KUsage = 32
export const KAs = 33
export const KOnly = 34
export const KSource = 35
export const KData = 36
export const KRef = 37
export const KAssert = 38
export const KRaise = 39
export const KConst = 40
export const KTrue = 41
export const KFalse = 42
export const KLocal = 43
export const KMatrix = 44
export const KMut = 45
export const KSyntax = 46
export const KIs = 47
export const KAny = 48
export const KTypeof = 49
export const KMap = 50
export const KCall = 51
export const KPackage = 52
export const KExtern = 53

// operators prefixed with @
export const APlus = 60
export const AMinus = 61
export const AMinusUnary = 62 // replaces AMinus if in an ExprUnary
export const AStar = 63
export const ASlash = 64
export const ACarat = 65
export const ATildeUnary = 66
export const ABar = 67
export const AAmp = 68
export const ABarBar = 69
export const AAmpAmp = 70
export const AAt = 71
export const ABackslash = 72
export const AEqEq = 73
export const ANe = 74
export const ALe = 75
export const AGe = 76
export const ALt = 77
export const AGt = 78
export const ABangUnary = 79
export const ALParen = 80
export const ARParen = 81
export const ALBrack = 82
export const ARBrack = 83
export const ALBrace = 84
export const ARBrace = 85
export const ALAngle = 86
export const ARAngle = 87
export const ALInterp = 88
export const ASemi = 89
export const AComma = 90
export const AColon = 91
export const AArrowRet = 92
export const AArrowMap = 93
export const AColonColon = 94
export const ADot = 95
export const ADotDot = 96
export const APercent = 97
export const AEq = 98
export const ATildeEq = 99
export const AHash = 100

// operators not prefixed with @
export const OPlus = 101
export const OMinus = 102
export const OMinusUnary = 103 // replaces OMinus if in an ExprUnary
export const OStar = 104
export const OSlash = 105
export const OCarat = 106
export const OTildeUnary = 107
export const OBar = 108
export const OAmp = 109
export const OBarBar = 110
export const OAmpAmp = 111
export const OAt = 112
export const OBackslash = 113
export const OEqEq = 114
export const ONe = 115
export const OLe = 116
export const OGe = 117
export const OLt = 118
export const OGt = 119
export const OBangUnary = 120
export const OLParen = 121
export const ORParen = 122
export const OLBrack = 123
export const ORBrack = 124
export const OLBrace = 125
export const ORBrace = 126
export const OLAngle = 127
export const ORAngle = 128
export const OLInterp = 129
export const OLRawInterp = 130
export const OSemi = 131
export const OComma = 132
export const OColon = 133
export const OArrowRet = 134
export const OArrowMap = 135
export const OColonColon = 136
export const ODot = 137
export const ODotDot = 138
export const OPercent = 139
export const OEq = 140
export const OTildeEq = 141
export const OHash = 142
export const ODotDotDot = 143

export const RTag = 144 // in latex#"world${2+3}hi"#, the 'latex'
export const RString = 145 // in latex#"world${2+3}hi"#, the 'world' and 'hi'
export const RInterp = 146 // in latex#"world${2+3}hi"#, the '2+3'
export const RTerminal = 147 // in latex#"world${2+3}hi"#, an invisible marker after the final hash

export type Brack =
  | typeof OLParen
  | typeof OLBrack
  | typeof OLBrace
  | typeof OLAngle
  | typeof OLInterp
  | typeof OLRawInterp

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
  package: KPackage,
  extern: KExtern,
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
  "^": ACarat,
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
  "^": OCarat,
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
  [OCarat]: "_pow",
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
  OCarat, // exponentiate
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
  ACarat, // exponentiate
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
  [OCarat]: "^",
  [ACarat]: "@^",
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
  [KPackage]: "package",
  [KExtern]: "extern",
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
