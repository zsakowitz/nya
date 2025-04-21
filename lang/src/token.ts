export const Kind = Object.freeze({
  Ident: 0, // struct, c32, viewport, f32, %odot
  IdentSym: 1, // :m, :s, :A, :px
  IdentBuiltin: 2, // @vec2, @vec4, @-, @>, @mix, @asinh, @min
  IdentLabel: 8, // 'outer, 'inner

  Ignore: 14, // _
  Kw: 13, // if, for, in
  KwExtern: 10, // source, using

  Number: 3, // 2.3, 7
  String: 4, // "hello world"
  Comment: 5, // // world
  Op: 6, // =, +, *, ;, :, ., $(, ]
  OpBuiltin: 12, // @==, @+, @*
  Source: 7, // anything inside a source block

  Group: 15, // (...) [...] {...} <...>
})

export declare namespace Kind {
  export type Ident = typeof Kind.Ident
  export type IdentSym = typeof Kind.IdentSym
  export type IdentBuiltin = typeof Kind.IdentBuiltin
  export type IdentLabel = typeof Kind.IdentLabel

  export type Ignore = typeof Kind.Ignore
  export type Kw = typeof Kind.Kw
  export type KwExtern = typeof Kind.KwExtern

  export type Number = typeof Kind.Number
  export type String = typeof Kind.String
  export type Comment = typeof Kind.Comment
  export type Op = typeof Kind.Op
  export type OpBuiltin = typeof Kind.OpBuiltin
  export type Source = typeof Kind.Source

  export type Group = typeof Kind.Group

  export type Lit = Number | IdentSym
}

export type Kind = (typeof Kind)[keyof typeof Kind]

const KEYWORDS = [
  "if",
  "else",
  "for",
  "match",
  "deriv",
  "simplify",
  "expose",
  "type",
  "fn",
  "struct",
  "opaque",
  "let",
  "in",
  "enum",
  "syntax",
  "return",
  "break",
  "continue",
  "use",
  "val",
  "usage",
] as const

export type Keyword = Extract<(typeof KEYWORDS)[keyof typeof KEYWORDS], string>

const IdentPrefixes = {
  ":": Kind.IdentSym,
  "@": Kind.IdentBuiltin,
  "'": Kind.IdentLabel,
  "%": Kind.Ident,
}

export class Token<T extends Kind, V extends string = string> {
  declare static readonly __kind: unique symbol;
  declare [Token.__kind]: V

  constructor(
    readonly kind: T,
    readonly start: number,
    readonly end: number,
    readonly virtual = false,
  ) {}

  is<K extends T>(kind: K): this is Token<K> {
    return this.kind == kind
  }
}

export const Code = Object.freeze({
  InvalidBuiltinName: 20,
  UnknownChar: 21,
  FloatMustEndInDigit: 22,
  UnterminatedString: 23,
  UnterminatedSource: 25,
  UnknownOperator: 24,
  MismatchedClosingParen: 28,
  MismatchedOpeningParen: 29,
})

export type Code = (typeof Code)[keyof typeof Code]

export class Issue {
  constructor(
    readonly code: Code,
    readonly start: number,
    readonly end: number,
  ) {}
}

const ID_START = /[A-Za-z_]/
const ID_CONT = /[A-Za-z0-9_]/
const WS = /\s/
const ANY_ID_START = /[@%:'A-Za-z_]/
const DIGIT = /[0-9]/
const INTERP = /\$\((?:([A-Za-z_]\w*)(?:(\.)(?:([A-Za-z_]\w*))?)?)?\)/g

const OPS = [
  "+",
  "-",
  "*",
  "/",
  "**",
  "~",
  "|",
  "&",
  "||",
  "&&",
  "@",
  "\\",
  "==",
  "!=",
  "<=",
  ">=",
  "<",
  ">",
  "~",
  "!",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "$(",
  ";",
  ",",
  ":",
  "->",
  "=>",
  "::",
  ".",
  "..",
  "=",
] as const

export type Operator = Extract<(typeof OPS)[keyof typeof OPS], string>

const OP_SECOND_CHARS: Record<string, string[]> = Object.create(null)

for (const op of OPS) {
  if (op.length == 2) {
    ;(OP_SECOND_CHARS[op[0]!] ??= []).push(op[1]!)
  } else if (op.length == 1) {
    OP_SECOND_CHARS[op[0]!] ??= []
  }
}

function is(regex: RegExp, char: string | undefined) {
  return char != null && regex.test(char)
}

export function tokens(source: string) {
  const ret: Token<Kind>[] = []
  const issues: Issue[] = []

  for (let i = 0; i < source.length; ) {
    const start = i
    const char = source[i]!

    if (WS.test(char)) {
      i++
      continue
    }

    if (ID_START.test(char)) {
      while (is(ID_CONT, source[++i]));
      if (source[i] == "^" && source[i + 1] == "-" && source[i + 2] == "1") {
        i += 3
      }
      const text = source.slice(start, i)
      ret.push(
        new Token(
          text == "source" || text == "using" ? Kind.KwExtern
          : KEYWORDS.includes(text as any) ? Kind.Kw
          : text == "_" ? Kind.Ignore
          : Kind.Ident,
          start,
          i,
        ),
      )
      continue
    }

    if (char == "@" && source[i + 1] && source[i + 1]! in OP_SECOND_CHARS) {
      i++
      const char = source[i]!
      const next = source[i + 1]
      if (next && OP_SECOND_CHARS[char]!.includes(next)) {
        ret.push(new Token(Kind.OpBuiltin, start, i + 2))
        i += 2
        continue
      }
      i++
      ret.push(new Token(Kind.OpBuiltin, start, i))
      if (!OPS.includes(char as any)) {
        issues.push(new Issue(Code.UnknownOperator, start, i))
      }
      continue
    }

    if (char in IdentPrefixes) {
      if (!is(ID_START, source[i + 1])) {
        ret.push(new Token(Kind.Op, start, ++i))
        if (!OPS.includes(char as any)) {
          issues.push(new Issue(Code.UnknownOperator, start, i))
        }
        continue
      }
      while (is(ID_CONT, source[++i]));
      ret.push(
        new Token(IdentPrefixes[char as keyof typeof IdentPrefixes], start, i),
      )
      issues.push(new Issue(Code.InvalidBuiltinName, start, i))
      continue
    }

    if (DIGIT.test(char)) {
      while (is(DIGIT, source[++i]));
      if (source[i] == "." && source[i + 1] != ".") {
        if (is(DIGIT, source[i + 1])) {
          i++
          while (is(DIGIT, source[++i]));
        } else if (!is(ANY_ID_START, source[i + 1])) {
          i++
          issues.push(new Issue(Code.FloatMustEndInDigit, start, i))
        }
      }
      ret.push(new Token(Kind.Number, start, i))
      continue
    }

    if (char == "/" && source[i + 1] == "/") {
      i++
      while (source[++i] != "\n");
      ret.push(new Token(Kind.Comment, start, i))
      continue
    }

    if (char == '"') {
      let terminated = false
      while (i < source.length) {
        i++
        if (source[i] == '"') {
          i++
          terminated = true
          break
        }
        if (source[i] == "\\") {
          i++
        }
      }
      ret.push(new Token(Kind.String, start, i))
      if (!terminated) {
        issues.push(new Issue(Code.UnterminatedString, start, i))
      }
      continue
    }

    if (char == "{") {
      const last = ret[ret.length - 1]
      const last2 = ret[ret.length - 2]
      if (
        last?.kind == Kind.KwExtern ||
        (last?.kind == Kind.Ident && last2?.kind == Kind.KwExtern)
      ) {
        let depth = 0
        loop: while (true) {
          const char = source[++i]
          switch (char) {
            case undefined:
              i++
              ret.push(new Token(Kind.Source, start, i))
              issues.push(new Issue(Code.UnterminatedSource, start, i))
              break loop
            case "{":
              depth++
              break
            case "}":
              if (depth == 0) {
                i++
                ret.push(new Token(Kind.Op, start, start + 1))
                const o = start + 1
                const contents = source.slice(o, i - 1)
                let match
                INTERP.lastIndex = 0
                let prev = 0
                while ((match = INTERP.exec(contents))) {
                  const start = o + match.index
                  ret.push(new Token(Kind.Source, o + prev, start))
                  const end = o + (prev = INTERP.lastIndex)
                  ret.push(new Token(Kind.Op, start, start + 2))
                  if (match[1]) {
                    const l1 = match[1].length
                    ret.push(new Token(Kind.Ident, start + 2, start + 2 + l1))
                    if (match[2]) {
                      const l2 = match[2].length
                      ret.push(
                        new Token(Kind.Op, start + 2 + l1, start + 2 + l1 + l2),
                      )
                      if (match[3]) {
                        const l3 = match[3].length
                        ret.push(
                          new Token(
                            Kind.Ident,
                            start + 2 + l1 + l2,
                            start + 2 + l1 + l2 + l3,
                          ),
                        )
                      }
                    }
                  }
                  ret.push(new Token(Kind.Op, end - 1, end))
                }
                ret.push(new Token(Kind.Source, o + prev, i - 1))
                ret.push(new Token(Kind.Op, i - 1, i))
                break loop
              } else {
                depth--
                break
              }
          }
        }
      } else {
        ret.push(new Token(Kind.Op, start, ++i))
      }
      continue
    }

    if (char in OP_SECOND_CHARS) {
      const next = source[i + 1]
      if (next && OP_SECOND_CHARS[char]!.includes(next)) {
        ret.push(new Token(Kind.Op, start, i + 2))
        i += 2
        continue
      }
      i++
      ret.push(new Token(Kind.Op, start, i))
      if (!OPS.includes(char as any)) {
        issues.push(new Issue(Code.UnknownOperator, start, i))
      }
      continue
    }

    issues.push(new Issue(Code.UnknownChar, start, ++i))
    continue
  }

  return { ret, issues }
}
