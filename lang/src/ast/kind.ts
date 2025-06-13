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
export const KFi = 22
export const KStruct = 23
export const KOpaque = 24
export const KLet = 25
export const KIn = 26
export const KEnum = 27
export const KReturn = 28
export const KBreak = 29
export const KContinue = 210
export const KUse = 211
export const KUsage = 212
export const KAs = 213
export const KOnly = 214
export const KSource = 215
export const KData = 216
export const KRef = 217
export const KAssert = 218
export const KRaise = 219
export const KConst = 220
export const KTrue = 221
export const KFalse = 222
export const KLocal = 223
export const KMatrix = 224
export const KMut = 225
export const KSyntax = 226
export const KIs = 227
export const KAny = 228
export const KTypeof = 229
export const KMap = 230
export const KCall = 231

// operators prefixed with @
export const APlus = 232
export const AMinus = 233
export const AMinusUnary = 234 // replaces AMinus if in an ExprUnary
export const AStar = 235
export const ASlash = 236
export const ACarat = 237
export const ATildeUnary = 238
export const ABar = 239
export const AAmp = 240
export const ABarBar = 241
export const AAmpAmp = 242
export const AAt = 243
export const ABackslash = 244
export const AEqEq = 245
export const ANe = 246
export const ALe = 247
export const AGe = 248
export const ALt = 249
export const AGt = 250
export const ABangUnary = 251
export const ALParen = 252
export const ARParen = 253
export const ALBrack = 254
export const ARBrack = 255
export const ALBrace = 256
export const ARBrace = 257
export const ALAngle = 258
export const ARAngle = 259
export const ALInterp = 260
export const ASemi = 261
export const AComma = 262
export const AColon = 263
export const AArrowRet = 264
export const AArrowMap = 265
export const AColonColon = 266
export const ADot = 267
export const ADotDot = 268
export const APercent = 269
export const AEq = 270
export const ATildeEq = 271
export const AHash = 272

// operators not prefixed with @
export const OPlus = 273
export const OMinus = 274
export const OMinusUnary = 275 // replaces OMinus if in an ExprUnary
export const OStar = 276
export const OSlash = 277
export const OCarat = 278
export const OTildeUnary = 279
export const OBar = 280
export const OAmp = 281
export const OBarBar = 282
export const OAmpAmp = 283
export const OAt = 284
export const OBackslash = 285
export const OEqEq = 286
export const ONe = 287
export const OLe = 288
export const OGe = 289
export const OLt = 290
export const OGt = 291
export const OBangUnary = 292
export const OLParen = 293
export const ORParen = 294
export const OLBrack = 295
export const ORBrack = 296
export const OLBrace = 297
export const ORBrace = 298
export const OLAngle = 299
export const ORAngle = 2100
export const OLInterp = 2101
export const OLRawInterp = 2102
export const OSemi = 2103
export const OComma = 2104
export const OColon = 2105
export const OArrowRet = 2106
export const OArrowMap = 2107
export const OColonColon = 2108
export const ODot = 2109
export const ODotDot = 2110
export const OPercent = 2111
export const OEq = 2112
export const OTildeEq = 2113
export const OHash = 2114
export const ODotDotDot = 2115

export const RTag = 2116 // in latex#"world${2+3}hi"#, the 'latex'
export const RString = 2117 // in latex#"world${2+3}hi"#, the 'world' and 'hi'
export const RInterp = 2118 // in latex#"world${2+3}hi"#, the '2+3'
export const RTerminal = 2119 // in latex#"world${2+3}hi"#, an invisible marker after the final hash

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
  fi: KFi,
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
  [KFi]: "fi",
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
