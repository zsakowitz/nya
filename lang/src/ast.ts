import type { Token } from "./token"

export interface TArgs {
  lt: Token
  args: GenericArg[]
  gt: Token
}

export interface Args {
  lt: Token
  args: Expr[]
  gt: Token
}

export interface Receiver {
  expr: Expr | null
  dot: Token
}

export interface Block {
  lt: Token
  stmts: Stmt[]
  expr: Expr | null
  gt: Token
}

export type MatchPattern =
  | { type: "literal"; value: Token; kind: "int" | "float" | "sym" }
  | { type: "destruct"; symbol: Token; lt: Token; into: Token[]; gt: Token }
  | { type: "ignore" }

export interface MatchArm {
  lhs: MatchPattern[]
  arrow: Token | null
  rhs: Expr
}

export type Expr =
  | {
      type: "var"
      receiver: Receiver
      value: Token
      /** Delimited by angle brackets. */
      targs: TArgs | null
      /** Delimited by parentheses or braces. */
      args: Args | null
    }
  | { type: "literal"; value: Token; kind: "int" | "float" | "sym" }
  | { type: "binary"; lhs: Expr; op: Token; rhs: Expr }
  | { type: "unary"; op: Token; arg: Expr }
  | { type: "_"; token: Token }
  | { type: "block"; label: Token | null; block: Block }
  | { type: "struct"; of: Args }
  | { type: "array"; of: Args }
  | {
      type: "for"
      value: Expr
      for: Token
      bound: Token[]
      in: Token
      of: Expr[]
    }
  | { type: "cast"; lhs: Expr; rhs: Type }
  | { type: "match"; match: Token; lt: Token; arms: MatchArm[]; gt: Token }
  | { type: "paren"; lt: Token; of: Expr; rt: Token }
  | {
      type: "source"
      /** 'source' or 'using' */
      source: Token
      lang: Token | null
      parts: Token[]
      interps: Expr[]
    }
  | {
      type: "exit"
      /** "return", "break", or "continue" */
      kind: Token
      label: Token | null
      value: Expr | null
    }

export type Stmt = { type: "expr"; expr: Expr }

export type GenericArg = {}

export type Type = {}
