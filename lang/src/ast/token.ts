import { Code, Issues, Pos } from "./issue"
import {
  APS,
  IDENT_PREFIXES,
  KSource,
  KUse,
  KWS,
  ODot,
  OLBrace,
  OLInterp,
  OP_TEXT,
  OPS,
  OPS_AND_SECOND_CHARS,
  ORBrace,
  ORParen,
  TComment,
  TDeriv,
  TDerivIgnore,
  TFloat,
  TIdent,
  TIgnore,
  TInt,
  TSource,
  TString,
} from "./kind"

export class Token<T extends number> extends Pos {
  declare static readonly __kind: unique symbol;
  declare [Token.__kind]: T

  constructor(
    readonly source: string,
    readonly kind: T,
    start: number,
    end: number,
    readonly virtual = false,
  ) {
    super(start, end)
  }

  get val(): string {
    if (this.kind in OP_TEXT) {
      return OP_TEXT[this.kind as keyof typeof OP_TEXT]
    }

    return this.source.slice(this.start, this.end)
  }
}

const ID_START = /[A-Za-z_]/
const ID_CONT = /[A-Za-z0-9_]/
const WS = /\s/
const ANY_ID_START = /[@%:'A-Za-z_]/
const DIGIT = /[0-9]/
const NUMERIC =
  /^(?:0x[\da-f]+(?:\.[\da-f]+)?(?:p[+-]?\d+)?|\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i
const INTERP = /\$\((?:([A-Za-z_]\w*)(?:(\.)(?:([A-Za-z_]\w*))?)?)?\)/g

function is(regex: RegExp, char: string | undefined) {
  return char != null && regex.test(char)
}

export interface ToTokensProps {
  comments: boolean
}

export function tokens(source: string, props: ToTokensProps) {
  const ret: Token<number>[] = []
  const issues = new Issues()

  for (let i = 0; i < source.length; ) {
    const start = i
    const char = source[i]!

    if (WS.test(char)) {
      i++
      continue
    }

    if (
      char == "d" &&
      source[i + 1] == "/" &&
      source[i + 2] == "d" &&
      is(ID_START, source[i + 3])
    ) {
      i += 2
      while (is(ID_CONT, source[++i]));
      const text = source.slice(start, i)
      ret.push(
        new Token(source, text == "d/d_" ? TDerivIgnore : TDeriv, start, i),
      )
      continue
    }

    if (ID_START.test(char)) {
      while (is(ID_CONT, source[++i]));
      const text = source.slice(start, i)
      ret.push(
        new Token(
          source,
          KWS[text] ?? (text == "_" ? TIgnore : TIdent),
          start,
          i,
        ),
      )
      continue
    }

    if (char == "%" && source[i + 1] == '"') {
      i++
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
      ret.push(new Token(source, TIdent, start, i))
      if (!terminated) {
        issues.raise(Code.UnterminatedStringIdent, new Pos(start, i))
      }
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
        if (char + next in APS) {
          ret.push(new Token(source, APS[char + next]!, start, i + 2))
        } else {
          issues.raise(Code.UnknownOperator, new Pos(start, i))
        }
        i += 2
        continue
      }
      i++
      if (char in APS) {
        ret.push(new Token(source, APS[char]!, start, i))
      } else {
        issues.raise(Code.UnknownOperator, new Pos(start, i))
      }
      continue
    }

    if (char in IDENT_PREFIXES && is(ID_START, source[i + 1])) {
      while (is(ID_CONT, source[++i]));
      ret.push(new Token(source, IDENT_PREFIXES[char]!, start, i))
      continue
    }

    if (DIGIT.test(char)) {
      const m = source.slice(i).match(NUMERIC)![0]
      i += m.length
      if (/[.ep]/.test(m)) {
        ret.push(new Token(source, TFloat, start, i))
      } else {
        ret.push(new Token(source, TInt, start, i))
      }
      if (is(ID_START, source[i])) {
        issues.raise(Code.LetterDirectlyAfterNumber, new Pos(i, i + 1))
      }
      continue
    }

    if (char == "/" && source[i + 1] == "/") {
      i++
      while (source[++i] != "\n");
      if (props.comments) {
        ret.push(new Token(source, TComment, start, i))
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
      ret.push(new Token(source, TString, start, i))
      if (!terminated) {
        issues.raise(Code.UnterminatedString, new Pos(start, i))
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
              ret.push(new Token(source, TSource, start, i))
              issues.raise(Code.UnterminatedSource, new Pos(start, i))
              break loop
            case "{":
              depth++
              break
            case "}":
              if (depth == 0) {
                i++
                ret.push(new Token(source, OLBrace, start, start + 1))
                const o = start + 1
                const contents = source.slice(o, i - 1)
                let match
                INTERP.lastIndex = 0
                let prev = 0
                while ((match = INTERP.exec(contents))) {
                  const start = o + match.index
                  ret.push(new Token(source, TSource, o + prev, start))
                  const end = o + (prev = INTERP.lastIndex)
                  ret.push(new Token(source, OLInterp, start, start + 2))
                  if (match[1]) {
                    const l1 = match[1].length
                    ret.push(
                      new Token(source, TIdent, start + 2, start + 2 + l1),
                    )
                    if (match[2]) {
                      const l2 = match[2].length
                      ret.push(
                        new Token(
                          source,
                          ODot,
                          start + 2 + l1,
                          start + 2 + l1 + l2,
                        ),
                      )
                      if (match[3]) {
                        const l3 = match[3].length
                        ret.push(
                          new Token(
                            source,
                            TIdent,
                            start + 2 + l1 + l2,
                            start + 2 + l1 + l2 + l3,
                          ),
                        )
                      }
                    }
                  }
                  ret.push(new Token(source, ORParen, end - 1, end))
                }
                ret.push(new Token(source, TSource, o + prev, i - 1))
                ret.push(new Token(source, ORBrace, i - 1, i))
                break loop
              } else {
                depth--
                break
              }
          }
        }
      } else {
        ret.push(new Token(source, OLBrace, start, ++i))
      }
      continue
    }

    if (char in OPS_AND_SECOND_CHARS) {
      const next = source[i + 1]
      if (next && OPS_AND_SECOND_CHARS[char]!.includes(next)) {
        ret.push(new Token(source, OPS[char + next]!, start, i + 2))
        i += 2
        continue
      }
      i++
      if (char in OPS) {
        ret.push(new Token(source, OPS[char]!, start, i))
      } else {
        issues.raise(Code.UnknownOperator, new Pos(start, i))
      }
      continue
    }

    issues.raise(Code.UnknownChar, new Pos(start, ++i))
    continue
  }

  return { ret, issues }
}
