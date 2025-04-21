import type { Keyword, Kind, Operator, Token } from "./token"

export type TokenComma = Op<",">

export type Kw<T extends Keyword> = Token<Kind.Kw, T>
export type Op<T extends Operator> = Token<Kind.Op, T>
export type Ident = Token<Kind.Ident>
export type Lit = Token<Kind.Lit>
export type Sym = Token<Kind.IdentSym>

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
  L extends "(" | "[" | "<" | "$(",
  R extends ")" | "]" | ">" | ")",
  K = TokenComma,
> = Bracketed<Delimited<T, K>, L, R>

export type CDelim<T, K = TokenComma> = Bracketed<Delimited<T, K>, "{", "}">

export interface GenericParam {
  ident: Ident
  colon: Op<":"> | null
  bound: Type | null
  eq: Op<"="> | null
  default: GenericArg | null
}

export type TParams = CDelim<GenericParam>
export type TArgs = CDelim<GenericArg>
export type Args = BDelim<Expr, "(", ")">

export interface Receiver {
  expr: Expr | null
  dot: Op<".">
}

export type Block = Bracketed<{ stmts: Stmt[]; expr: Expr | null }, "{", "}">

export type MatchPattern =
  | { type: "literal"; value: Lit; kind: "int" | "float" | "sym" }
  | {
      type: "destruct"
      symbol: Token<Kind.IdentSym>
      into: CDelim<Ident>
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
  locals: Delimited<Ident>
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
  | { type: "literal"; value: Lit; kind: "int" | "float" | "sym" }
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
  | ExprSource
  | { type: "cast"; lhs: Expr; rhs: Type }
  | {
      type: "match"
      match: Kw<"match">
      on: Expr
      arms: CDelim<MatchArm>
    }
  | { type: "paren"; of: Bracketed<Expr, "(", ")"> }
  | {
      type: "exit"
      /** "return", "break", or "continue" */
      kind: Kw<"return" | "break" | "continue">
      label: Token<Kind.IdentLabel> | null
      value: Expr | null
    }

export type ExprSource1 = {
  type: "source"
  /** 'source' or 'using' */
  source: Token<Kind.KwExtern, "source" | "using">
  lang: Ident | null
  parts: Token<Kind.Source>[]
  interps: Bracketed<Expr, "$(", ")">[]
}

export type ExprSource = ExprSource1[]

export type Stmt =
  | { type: "expr"; expr: Expr; semi: Op<";"> | null }
  | {
      type: "let"
      let: Kw<"let">
      name: Ident
      colon: Op<":"> | null
      ty: Type | null
      eq: Op<"="> | null
      expr: Expr | null
      semi: Op<";"> | null
    }

export type GenericArg =
  | Type
  | { type: "literal"; value: Lit; kind: "int" | "float" | "sym" }
  | { type: "val"; val: Kw<"val">; of: Bracketed<Expr, "{", "}"> }

export type Type =
  | { type: "name"; name: Ident; targs: TArgs | null }
  | {
      type: "array"
      array: Bracketed<
        { of: Type; semi: Op<";"> | null; size: Delimited<Expr> },
        "[",
        "]"
      >
    }

export interface FieldDecl {
  ident: Ident
  colon: Op<":"> | null
  type: Type
  eq: Op<"="> | null
  value: Expr
}

export interface ParamDecl {
  ident: Ident
  colon: Op<":"> | null
  type: Type
}

export type Params = BDelim<ParamDecl, "(", ")">

export type Item =
  | {
      type: "type"
      kw: Kw<"type">
      attrs: BDelim<Kw<"opaque">, "(", ")"> | null
      name: Ident
      write: Bracketed<ExprSource, "{", "}">
    }
  | {
      type: "struct"
      kw: Kw<"struct">
      name: Ident
      tparams: TParams | null
      fields: CDelim<{ name: Ident; comma: Op<","> | null; type: Type }>
    }
  | {
      type: "syntax"
      name: Ident
      arrow: Op<"->"> | null
      ret: Ident | null
      semi: Op<";"> | null
    }
  | {
      type: "enum+map"
      name: Ident
      tparams: TParams | null
      arrow: Op<"->">
      ret: Type
      fields: CDelim<{ sym: Sym; arrow: Op<"=>"> | null; value: Expr | null }>
    }
  | {
      type: "enum"
      name: Ident
      tparams: TParams | null
      fields: CDelim<{ sym: Sym; fields: CDelim<FieldDecl> | null }>
    }
  | {
      type: "fn"
      name: Ident
      tparams: TParams | null
      params: Params | null
      arrow: Op<"->"> | null
      ret: Type | null
      block: Block
      usagekw: Kw<"usage"> | null
      usage: Token<Kind.String> | BDelim<Token<Kind.String>, "[", "]"> | null
    }
  | {
      type: "use"
      path: Token<Kind.String>
    }
// expose, deriv, simplify
