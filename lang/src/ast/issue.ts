export const Code = Object.freeze({
  LetterDirectlyAfterNumber: 19,
  InvalidBuiltinName: 20,
  UnknownChar: 21,
  FloatMustEndInDigit: 22,
  UnterminatedString: 23,
  UnknownOperator: 24,
  UnterminatedSource: 25,
  UnterminatedStringIdent: 26,
  MismatchedClosingParen: 28,
  MismatchedOpeningParen: 29,
  ExpectedIdent: 30,
  ExpectedExpression: 31,
  UnexpectedToken: 32,
  IfOrBlockMustFollowElse: 33,
  ExpectedType: 34,
  MissingSemi: 35,
  MissingRuleArrow: 36,
  ExpectedBlock: 37,
  ExpectedForBindings: 38,
  ExpectedForSources: 39,
  ExpectedIn: 40,
  UnnecessarySemi: 41,
  ExpectedColon: 42,
  ExpectedFnParams: 43,
  ExpectedFnName: 44,
  InvalidLabeledExit: 45,
  InvalidValuedExit: 46,
  ExpectedPat: 47,
  ExpectedMatchArrow: 48,
  ExpectedMatchArms: 49,
  ExpectedImportPath: 50,
  ExpectedStructFields: 51,
  ExpectedEnumVariants: 52,
  ExpectedEnumVariantValue: 53,
  ExpectedCommaOrSemi: 54,
  InvalidExposeKind: 55,
  NoGenericsOnExposedFn: 56,
  ExpectedExposeString: 57,
  InvalidLabel: 58,
  OnlyValidAsExposedAlias: 59,
  ExpectedAssertFailureReason: 60,
  ExpectedConstWrtList: 61,
  VarParamFollowedByArguments: 62,
  NonParamFollowedByConstMarker: 63,
  NonParamFollowedByTypeAssertion: 64,
  ExpectedUsageExamples: 65,

  // Emit errors
  IntTooLarge: 70,
  AssertionsMustResultInBool: 71,

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
}

export class Issue {
  constructor(
    readonly code: Code,
    readonly pos: Pos,
  ) {}
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
