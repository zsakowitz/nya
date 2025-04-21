import type { Keyword, Kind, Operator, Token } from "./token"

type TokenComma = Op<",">

type Kw<T extends Keyword> = Token<Kind.Kw, T>
type Op<T extends Operator> = Token<Kind.Op, T>

export interface Delimited<T, K = TokenComma> {
  items: T[]
  delims: K[]
}

export interface Bracketed<
  T,
  L extends "(" | "[" | "{" | "<" | "$(",
  R extends ")" | "]" | "}" | ">" | ")",
> {
  lt: Op<L>
  value: T
  gt: Op<R>
}

export type BDelim<
  T,
  L extends "(" | "[" | "{" | "<" | "$(",
  R extends ")" | "]" | "}" | ">" | ")",
  K = TokenComma,
> = Bracketed<Delimited<T, K>, L, R>

export type TArgs = BDelim<GenericArg, "{", "}">
export type Args = BDelim<Expr, "(", ")">

export interface Receiver {
  expr: Expr | null
  dot: Op<".">
}

export type Block = Bracketed<{ stmts: Stmt[]; expr: Expr | null }, "{", "}">

export type MatchPattern =
  | { type: "literal"; value: Token<Kind.Lit>; kind: "int" | "float" | "sym" }
  | {
      type: "destruct"
      symbol: Token<Kind.IdentSym>
      into: BDelim<Token<Kind.Ident>, "{", "}">
    }
  | { type: "ignore" }

export interface MatchArm {
  lhs: Delimited<MatchPattern>
  arrow: Op<"=>"> | null
  rhs: Expr
}

export interface If {
  if: Kw<"if">
  condition: Expr
  block: Block
}

export interface ElseIf {
  else: Kw<"else">
  if: Kw<"if">
  condition: Expr
  block: Block
}

export interface Else {
  else: Kw<"else">
  block: Block
}

export interface ExprIf {
  type: "if"
  if: If
  elif: ElseIf[]
  else: Else | null
}

export interface ExprFor {
  type: "for"
  for: Kw<"for">
  locals: Delimited<Token<Kind.Ident>>
  eq: Op<"=">
  source: Delimited<Expr>
  value: Block
}

export type Expr =
  | {
      type: "var"
      receiver: Receiver | null
      name: Token<Kind.Ident | Kind.IdentBuiltin>
      /** Delimited by angle brackets. */
      targs: TArgs | null
      /** Delimited by parentheses or braces. */
      args: Args | null
    }
  | { type: "literal"; value: Token<Kind.Lit>; kind: "int" | "float" | "sym" }
  | {
      type: "binary"
      lhs: Expr
      op: Token<Kind.Op | Kind.OpBuiltin>
      rhs: Expr
    }
  | { type: "unary"; op: Token<Kind.Op | Kind.OpBuiltin>; arg: Expr }
  | { type: "_"; token: Token<Kind.Ignore> }
  | { type: "block"; label: Token<Kind.IdentLabel> | null; block: Block }
  | { type: "struct"; of: Args }
  | { type: "array"; of: Args }
  | ExprFor
  | ExprIf
  | { type: "cast"; lhs: Expr; rhs: Type }
  | {
      type: "match"
      match: Kw<"match">
      on: Expr
      arms: BDelim<MatchArm, "{", "}">
    }
  | { type: "paren"; of: Bracketed<Expr, "(", ")"> }
  | {
      type: "source"
      /** 'source' or 'using' */
      source: Token<Kind.KwExtern, "source" | "using">
      lang: Token<Kind.Ident> | null
      parts: Token<Kind.Source>[]
      interps: Bracketed<Expr, "$(", ")">[]
    }
  | {
      type: "exit"
      /** "return", "break", or "continue" */
      kind: Kw<"return" | "break" | "continue">
      label: Token<Kind.IdentLabel> | null
      value: Expr | null
    }

export type Stmt =
  | { type: "expr"; expr: Expr; semi: Op<";"> | null }
  | {
      type: "let"
      let: Kw<"let">
      name: Token<Kind.Ident>
      colon: Op<":"> | null
      ty: Type | null
      eq: Op<"="> | null
      expr: Expr | null
      semi: Op<";"> | null
    }

export type GenericArg =
  | Type
  | { type: "literal"; value: Token<Kind.Lit>; kind: "int" | "float" | "sym" }
  | { type: "val"; val: Kw<"val">; of: Bracketed<Expr, "{", "}"> }

export type Type =
  | { type: "name"; name: Token<Kind.Ident>; targs: TArgs | null }
  | {
      type: "array"
      array: Bracketed<
        { of: Type; semi: Op<";"> | null; size: Delimited<Expr> },
        "[",
        "]"
      >
    }
