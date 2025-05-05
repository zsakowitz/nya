`fn` items define callable functions.

`struct` items define constructable types.

`enum` items define constructable enums.

Every expression has a type.

Many expressions have an expected result type.

Types are composed of types and const values.

## How to emit nya code

For JS, generics are just passed as another parameter.

For GLSL, generics must be compiled away. This will be dealt with later.

How and what do these all output?

**Expr**

- Takes a script block to print needed statements
- Accepts an optional expected type for inference purposes
- Emits an expression and needed statements
- Outputs the actual type of the item

**Type**

- Does not emit anything immediately
- Has TS declarations
- Returns a type usable for expression inference

**Stmt**

- Emits needed statements and possibly an expression

**Item `struct`**

- Declares a data type
- Inferred structs in a struct result place turn into the struct

**Item `enum`**

- Declares a data type
- Symbols in an enum result place turn into the enum variant

**Item `fn`**

- Declares a callable function

**Pat**

## How this interops with project nya as-is

Say the user types:

```nya
a = 2 * d/dx erf(x)
y - a^a with y=5
```

Currently, this is transformed into:

```
defs
  a =>
    op *
      num 2
      deriv(x)
        call
          erf
          x

op with
  op -
    y
    op ^
      a
      a
  op =
    y
    5
```

In JS or GLSL, this is evaluated in the normal recursive style.

In the future, 'deriv' will hand a symbolic representation of its contents to
nyalang, which will simplify them. The \*, -, ^, and erf functions will also be
defined and emitted from nyalang.

## Interop ideas

The best-case scenario would be to handle everything inside nyalang. This is
made complicated by 'with', sums, and user definitions.

## Output modes

1. List of exposed functions, types, and variables
2. Derivative rules
3. Statically genericized functions for JS
4. Monomorphizied functions for GLSL

## Parsing and compiling

There are many stages of internal layers:

1. Source code
2. Array of tokens
3. Array of tokens with resolved grouping operators
4. AST directly from token list
5. HIR = AST but:
   1. unified function call/variable syntax
   2. identifiers and symbols are replaced with ids
   3. no parentheses
