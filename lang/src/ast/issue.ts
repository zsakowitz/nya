export const Code = Object.freeze({
  LetterDirectlyAfterNumber: 201,
  InvalidBuiltinName: 202,
  UnknownChar: 203,
  FloatMustEndInDigit: 204,
  UnterminatedString: 205,
  UnknownOperator: 206,
  UnterminatedSource: 207,
  UnterminatedStringIdent: 208,
  MismatchedClosingParen: 209,
  MismatchedOpeningParen: 210,
  ExpectedIdent: 211,
  ExpectedExpression: 212,
  UnexpectedToken: 213,
  IfOrBlockMustFollowElse: 214,
  ExpectedType: 215,
  MissingSemi: 216,
  MissingRuleArrow: 217,
  ExpectedBlock: 218,
  ExpectedForBindings: 219,
  ExpectedForSources: 220,
  ExpectedIn: 221,
  ExpectedColon: 222,
  ExpectedFnParams: 223,
  ExpectedFnName: 224,
  InvalidLabeledExit: 225,
  InvalidValuedExit: 226,
  ExpectedPat: 227,
  ExpectedMatchArrow: 228,
  ExpectedMatchArms: 229,
  ExpectedImportPath: 230,
  ExpectedStructFields: 231,
  ExpectedEnumVariants: 232,
  ExpectedEnumVariantValue: 233,
  ExpectedCommaOrSemi: 234,
  InvalidExposeKind: 235,
  NoGenericsOnExposedFn: 236,
  ExpectedExposeString: 237,
  InvalidLabel: 238,
  ExpectedAssertFailureReason: 239,
  ExpectedConstWrtList: 240,
  VarParamFollowedByArguments: 241,
  NonParamFollowedByConstMarker: 242,
  NonParamFollowedByTypeAssertion: 243,
  ExpectedUsageExamples: 244,
  ExpectedDestructuring: 245,
  UseDotAsAStructNameForDestructuringInPatterns: 246,
  FnReturnTypeMustNotBeBlock: 247,
  CommentsMustBeItemsOrStatementsWhenPrettyPrinting: 248,
  ShouldHaveAlreadyParsedBinaryOperator: 249,
  ExpectedEq: 250,

  // Emit errors
  ItemDeclaredTwice: 301,

  // future error ideas:
  // match on nonexhaustive enum
  // exposed function uses unexposed types
  // unused label
})

export type Code = (typeof Code)[keyof typeof Code]

export class Pos {
  constructor(
    readonly start: number,
    readonly end: number,
  ) {}

  toString() {
    return `${this.start}..${this.end}`
  }
}

export class Issue {
  constructor(
    readonly code: Code,
    readonly pos: Pos,
  ) {}

  toString() {
    return `${Object.entries(Code).find(([, v]) => v == this.code)?.[0] || "Unknown issue"} @ ${this.pos.start}..${this.pos.end}`
  }
}

export class Issues {
  readonly entries: Issue[] = []

  raise(code: Code, pos: Pos) {
    this.entries.push(new Issue(code, pos))
  }

  ok() {
    return this.entries.length == 0
  }
}
