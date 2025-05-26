export const enum Precedence {
  CommaR0,
  WithL,
  WithR,
  Iterate,
  IterateHelperL,
  IterateHelperR,
  CommaL,
  CommaR,

  BoolNot,
  BoolOrL,
  BoolOrR,
  BoolAndL,
  BoolAndR,

  CmpL,
  CmpR,

  SumL,
  SumR,

  BigSym,
  ImplicitFnL,
  ImplicitFnR,

  ProductL,
  ProductR,

  ExponentR,
  ExponentL,

  Suffixed,
}
