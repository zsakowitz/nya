export const enum Precedence {
  CommaR0,
  WithL,
  WithR,
  Iterate,
  IterateHelperL,
  IterateHelperR,
  CommaL,
  CommaR,

  MapsToL,
  MapsToR,

  BecomesL,
  BecomesR,

  BoolOrL,
  BoolOrR,
  BoolAndL,
  BoolAndR,

  BoolNot,

  CmpL,
  CmpR,

  SumL,
  SumR,

  BigSym,
  ImplicitFnL,
  ImplicitFnR,

  ProdL,
  ProdR,

  Negation,

  ExponentR,
  ExponentL,

  // No user-land operators should be defined with higher precedence than
  // `Juxtapose`, since it will mean `3(4)` and `a(4) with a=3` will mean
  // different things based on context; this is why `2 ÷ 3(4)` and `2 ÷ a(4)`
  // mean different things in Desmos.
  JuxtaposeL,
  JuxtaposeR,

  // This is sort of a lie, since suffixes have lower precedence than function
  // calls if the function name turns out to be a variable, but that's
  // special-cased to work differently.
  Suffixed,
}

export const PRECEDENCE_WORD_UNARY: Record<string, Precedence> =
  Object.create(null)

export const PRECEDENCE_WORD_BINARY: Record<
  string,
  [pl: Precedence, pr: Precedence]
> = Object.create(null)

export { Precedence as P }
