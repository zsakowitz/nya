import {
  IDENT_PREFIXES,
  KSource,
  KUse,
  KWS,
  ODot,
  OLBrace,
  OLInterp,
  OPS,
  OPS_AND_SECOND_CHARS,
  ORBrace,
  ORParen,
  TComment,
  TFloat,
  TIdent,
  TIgnore,
  TInt,
  TSource,
  TString,
} from "./kind"

export class Token<T extends number> {
  declare static readonly __kind: unique symbol;
  declare [Token.__kind]: T

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
  ExpectedIdentifier: 30,
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

function is(regex: RegExp, char: string | undefined) {
  return char != null && regex.test(char)
}

export interface ToTokensProps {
  comments: boolean
}

export function tokens(source: string, props: ToTokensProps) {
  const ret: Token<number>[] = []
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
        new Token(KWS[text] ?? (text == "_" ? TIgnore : TIdent), start, i),
      )
      continue
    }

    if (
      char == "@" &&
      source[i + 1] &&
      source[i + 1]! in OPS_AND_SECOND_CHARS
    ) {
      i++
      const char = source[i]!
      const next = source[i + 1]
      if (next && OPS_AND_SECOND_CHARS[char]!.includes(next)) {
        ret.push(new Token(OPS[char]!, start, i + 2))
        i += 2
        continue
      }
      i++
      if (char in OPS) {
        ret.push(new Token(OPS[char]!, start, i))
      } else {
        issues.push(new Issue(Code.UnknownOperator, start, i))
      }
      continue
    }

    if (char in IDENT_PREFIXES) {
      if (!is(ID_START, source[i + 1])) {
        if (char in OPS) {
          ret.push(new Token(OPS[char]!, start, ++i))
        } else {
          issues.push(new Issue(Code.UnknownOperator, start, ++i))
        }
        continue
      }
      while (is(ID_CONT, source[++i]));
      ret.push(new Token(IDENT_PREFIXES[char]!, start, i))
      continue
    }

    if (DIGIT.test(char)) {
      while (is(DIGIT, source[++i]));
      if (source[i] == "." && source[i + 1] != ".") {
        if (is(DIGIT, source[i + 1])) {
          i++
          while (is(DIGIT, source[++i]));
          ret.push(new Token(TFloat, start, i))
        } else if (!is(ANY_ID_START, source[i + 1])) {
          i++
          issues.push(new Issue(Code.FloatMustEndInDigit, start, i))
        }
      } else {
        ret.push(new Token(TInt, start, i))
      }
      continue
    }

    if (char == "/" && source[i + 1] == "/") {
      i++
      while (source[++i] != "\n");
      if (props.comments) {
        ret.push(new Token(TComment, start, i))
      }
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
      ret.push(new Token(TString, start, i))
      if (!terminated) {
        issues.push(new Issue(Code.UnterminatedString, start, i))
      }
      continue
    }

    if (char == "{") {
      const last1 = ret[ret.length - 1]
      const last2 = ret[ret.length - 2]
      if (
        last1?.kind == KSource || // source {
        (last1?.kind == TIdent && last2?.kind == KSource) || // source js {
        (last1?.kind == TIdent && last2?.kind == KUse) // use js {
      ) {
        let depth = 0
        loop: while (true) {
          const char = source[++i]
          switch (char) {
            case undefined:
              i++
              ret.push(new Token(TSource, start, i))
              issues.push(new Issue(Code.UnterminatedSource, start, i))
              break loop
            case "{":
              depth++
              break
            case "}":
              if (depth == 0) {
                i++
                ret.push(new Token(OLBrace, start, start + 1))
                const o = start + 1
                const contents = source.slice(o, i - 1)
                let match
                INTERP.lastIndex = 0
                let prev = 0
                while ((match = INTERP.exec(contents))) {
                  const start = o + match.index
                  ret.push(new Token(TSource, o + prev, start))
                  const end = o + (prev = INTERP.lastIndex)
                  ret.push(new Token(OLInterp, start, start + 2))
                  if (match[1]) {
                    const l1 = match[1].length
                    ret.push(new Token(TIdent, start + 2, start + 2 + l1))
                    if (match[2]) {
                      const l2 = match[2].length
                      ret.push(
                        new Token(ODot, start + 2 + l1, start + 2 + l1 + l2),
                      )
                      if (match[3]) {
                        const l3 = match[3].length
                        ret.push(
                          new Token(
                            TIdent,
                            start + 2 + l1 + l2,
                            start + 2 + l1 + l2 + l3,
                          ),
                        )
                      }
                    }
                  }
                  ret.push(new Token(ORParen, end - 1, end))
                }
                ret.push(new Token(TSource, o + prev, i - 1))
                ret.push(new Token(ORBrace, i - 1, i))
                break loop
              } else {
                depth--
                break
              }
          }
        }
      } else {
        ret.push(new Token(OLBrace, start, ++i))
      }
      continue
    }

    if (char in OPS_AND_SECOND_CHARS) {
      const next = source[i + 1]
      if (next && OPS_AND_SECOND_CHARS[char]!.includes(next)) {
        ret.push(new Token(OPS[char]!, start, i + 2))
        i += 2
        continue
      }
      i++
      if (char in OPS) {
        ret.push(new Token(OPS[char]!, start, i))
      } else {
        issues.push(new Issue(Code.UnknownOperator, start, i))
      }
      continue
    }

    issues.push(new Issue(Code.UnknownChar, start, ++i))
    continue
  }

  return { ret, issues }
}
