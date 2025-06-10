import { Chunk, Code, Issues, Pos } from "./issue"
import {
  ACarat,
  APS,
  IDENT_PREFIXES,
  KSource,
  KUse,
  KWS,
  OCarat,
  ODot,
  OLBrace,
  OLInterp,
  OP_TEXT,
  OPS,
  OPS_AND_SECOND_CHARS,
  ORBrace,
  ORParen,
  RInterp,
  RString,
  RTag,
  RTerminal,
  TComment,
  TDeriv,
  TDerivIgnore,
  TFloat,
  TIdent,
  TInt,
  TSource,
  TString,
} from "./kind"

export class Token<T extends number> extends Pos {
  declare static readonly __kind: unique symbol;
  declare [Token.__kind]: T

  constructor(
    info: Chunk,
    readonly kind: T,
    start: number,
    end: number,
    readonly virtual = false,
  ) {
    super(start, end, info)
  }

  get val(): string {
    if (this.kind in OP_TEXT) {
      return OP_TEXT[this.kind]!
    }

    return this.info.source.slice(this.start, this.end)
  }

  get value() {
    return this.val
  }
}

const NUMERIC =
  /^(?:0x[\da-f]+(?:\.[\da-f]+)?(?:p[+-]?\d+)?|\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i
const INTERP = /\$\((?:([A-Za-z_]\w*)(?:(\.)(?:([A-Za-z_]\w*))?)?)?\)/g

export interface ToTokensProps {
  comments: boolean
}

const C_SPACE = " ".charCodeAt(0)
const C_SPACE1 = "\n".charCodeAt(0)
const C_SPACE2 = "\r".charCodeAt(0)
const C_SPACE3 = "\f".charCodeAt(0)
const C_SPACE4 = "\v".charCodeAt(0)
const C_SPACE5 = "\t".charCodeAt(0)

const C_UNDERSCORE = "_".charCodeAt(0)
const C_A = "A".charCodeAt(0)
const C_Z = "Z".charCodeAt(0)
const C_a = "a".charCodeAt(0)
const C_z = "z".charCodeAt(0)
const C_d = "d".charCodeAt(0)
const C_0 = "0".charCodeAt(0)
const C_9 = "9".charCodeAt(0)

const C_PERCENT = "%".charCodeAt(0)
const C_AT = "@".charCodeAt(0)
const C_SLASH = "/".charCodeAt(0)
const C_DQUOTE = '"'.charCodeAt(0)
const C_HASH = "#".charCodeAt(0)
const C_LBRACE = "{".charCodeAt(0)
const C_RBRACE = "}".charCodeAt(0)
const C_DOLLARSIGN = "$".charCodeAt(0)
const C_STAR = "*".charCodeAt(0)

// PERF IMPROVEMENTS OVER TIME
// 610.6µs ± 23µs baseline
// 552.8µs ± 32µs adding charcodeat
// 528.9µs ± ??µs whitespace, d/dx, plain ident
// 529.8µs ± 29µs %id, @id
// 520.1µs ± 45µs numbers
// 510.1µs ± 33µs comments
// 509.0µs ± 28µs string, lbrace
// 503.8µs ± 27µs ops
// 490.1µs ± 22µs set for ops
// 478.3µs ± 33µs numerics for ident prefixes
// 445.3µs ± 38µs more isIdCont
// 445.4µs ± 38µs more id fns
// 451.6µs ± 30µs remove special _ case
// 444.0µs ± ??µs freeze objects + null proto

function isWs(cc: number) {
  return (
    cc === C_SPACE ||
    cc === C_SPACE1 ||
    cc === C_SPACE2 ||
    cc === C_SPACE3 ||
    cc === C_SPACE4 ||
    cc === C_SPACE5
  )
}

function isIdStart(cc: number) {
  return (
    (C_A <= cc && cc <= C_Z) || (C_a <= cc && cc <= C_z) || cc == C_UNDERSCORE
  )
}

function isDigit(cc: number) {
  return C_0 <= cc && cc <= C_9
}

function isIdCont(cc: number) {
  return (
    (C_A <= cc && cc <= C_Z) ||
    (C_a <= cc && cc <= C_z) ||
    (C_0 <= cc && cc <= C_9) ||
    cc == C_UNDERSCORE
  )
}

export function tokens(
  chunk: Chunk,
  issues: Issues,
  props: ToTokensProps,
  start = 0,
  end = chunk.source.length,
) {
  const source = chunk.source

  const ret: Token<number>[] = []
  for (let i = start; i < end; ) {
    const start = i
    const char = source[i]!
    const cc = source.charCodeAt(i)

    if (isWs(cc)) {
      i++
      continue
    }

    if (
      cc === C_d &&
      source[i + 1] == "/" &&
      source[i + 2] == "d" &&
      isIdStart(source.charCodeAt(i + 3))
    ) {
      i += 2
      while (isIdCont(source.charCodeAt(++i)));
      const text = source.slice(start, i)
      ret.push(
        new Token(chunk, text == "d/d_" ? TDerivIgnore : TDeriv, start, i),
      )
      continue
    }

    if (
      isIdStart(cc) ||
      (cc == C_PERCENT && isIdStart(source.charCodeAt(i + 1)))
    ) {
      if (cc == C_PERCENT) i++
      while (isIdCont(source.charCodeAt(++i)));
      const text = source.slice(start, i)
      const idStart = start
      const idEnd = i
      const ident = new Token(chunk, KWS[text] ?? TIdent, idStart, idEnd)
      if (
        ident.kind != TIdent ||
        !(source.charCodeAt(i) == C_HASH || source.charCodeAt(i) == C_DQUOTE)
      ) {
        ret.push(ident)
        continue
      }

      let hashes = 0
      while (source.charCodeAt(i) == C_HASH) {
        hashes++
        i++
      }
      if (source.charCodeAt(i) != C_DQUOTE) {
        issues.raise(Code.InvalidRawString, new Pos(idStart, i, chunk))
        ret.push(ident)
        continue
      }
      i++
      ret.push(new Token(chunk, RTag, idStart, idEnd))
      let textStart = i
      let textEnd: number
      while (true) {
        if (i >= source.length) {
          issues.raise(Code.UnterminatedString, new Pos(i, i, chunk))
          textEnd = i
          break
        }

        const next = source.charCodeAt(i)

        special: if (next == C_DQUOTE) {
          // source[i] is "
          for (let j = 0; j < hashes; j++) {
            if (source.charCodeAt(i + j + 1) != C_HASH) {
              break special
            }
          }
          // source[i+1..i+1+j] is #

          // source[i] is "
          textEnd = i
          i += hashes + 1
          // source[i] is unknown
          break
        } else if (next == C_DOLLARSIGN) {
          if (source.charCodeAt(i + 1) != C_LBRACE) break special
          ret.push(new Token(chunk, RString, textStart, i))

          i += 2
          // source[i] is unknown
          let braces = 0
          const interpStart = i
          let interpEnd: number
          while (true) {
            if (i >= source.length) {
              interpEnd = i
              issues.raise(Code.UnterminatedStringInterp, new Pos(i, i, chunk))
              break
            }

            const next = source.charCodeAt(i)
            if (next == C_LBRACE) {
              i++
              braces++
            } else if (next == C_RBRACE) {
              if (braces > 0) {
                braces--
                i++
              } else {
                interpEnd = i
                i++
                break
              }
            } else {
              i++
            }
          }
          ret.push(new Token(chunk, RInterp, interpStart, interpEnd))
          textStart = interpEnd + 1
          continue
        }

        i++
      }
      ret.push(new Token(chunk, RString, textStart, textEnd))
      ret.push(new Token(chunk, RTerminal, i, i))
      continue
    }

    if (cc == C_PERCENT && source[i + 1] == '"') {
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
      ret.push(new Token(chunk, TIdent, start, i))
      if (!terminated) {
        issues.raise(Code.UnterminatedStringIdent, new Pos(start, i, chunk))
      }
      continue
    }

    if (
      cc == C_AT &&
      source[i + 1] &&
      source.charCodeAt(i + 1) in OPS_AND_SECOND_CHARS
    ) {
      i++
      const char = source[i]!
      const next = source[i + 1]
      const nextcc = source.charCodeAt(i + 1)
      if (cc == C_STAR && nextcc == C_STAR) {
        issues.raise(
          Code.UseCaratAsExponentiationOperator,
          new Pos(i, i + 2, chunk),
        )
        ret.push(new Token(chunk, ACarat, i, i + 2, true))
        i += 2
        continue
      }
      if (next && OPS_AND_SECOND_CHARS[cc]!.has(nextcc)) {
        if (char + next in APS) {
          ret.push(new Token(chunk, APS[char + next]!, start, i + 2))
        } else {
          issues.raise(Code.UnknownOperator, new Pos(start, i, chunk))
        }
        i += 2
        continue
      }
      i++
      if (char in APS) {
        ret.push(new Token(chunk, APS[char]!, start, i))
      } else {
        issues.raise(Code.UnknownOperator, new Pos(start, i, chunk))
      }
      continue
    }

    if (cc in IDENT_PREFIXES && isIdStart(source.charCodeAt(i + 1))) {
      while (isIdCont(source.charCodeAt(++i)));
      ret.push(new Token(chunk, IDENT_PREFIXES[cc]!, start, i))
      continue
    }

    if (isDigit(cc)) {
      const m = source.slice(i).match(NUMERIC)![0]
      i += m.length
      if (/[.ep]/.test(m)) {
        ret.push(new Token(chunk, TFloat, start, i))
      } else {
        ret.push(new Token(chunk, TInt, start, i))
      }
      if (isIdStart(source.charCodeAt(i))) {
        issues.raise(Code.LetterDirectlyAfterNumber, new Pos(i, i + 1, chunk))
      }
      continue
    }

    if (cc === C_SLASH && source.charCodeAt(i + 1) === C_SLASH) {
      i++
      while (source[++i] && source[i] != "\n");
      if (props.comments) {
        ret.push(new Token(chunk, TComment, start, i))
      }
      continue
    }

    if (cc === C_DQUOTE) {
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
      ret.push(new Token(chunk, TString, start, i))
      if (!terminated) {
        issues.raise(Code.UnterminatedString, new Pos(start, i, chunk))
      }
      continue
    }

    if (cc === C_LBRACE) {
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
              ret.push(new Token(chunk, TSource, start, i))
              issues.raise(Code.UnterminatedSource, new Pos(start, i, chunk))
              break loop
            case "{":
              depth++
              break
            case "}":
              if (depth == 0) {
                i++
                ret.push(new Token(chunk, OLBrace, start, start + 1))
                const o = start + 1
                const contents = source.slice(o, i - 1)
                let match
                INTERP.lastIndex = 0
                let prev = 0
                while ((match = INTERP.exec(contents))) {
                  const start = o + match.index
                  ret.push(new Token(chunk, TSource, o + prev, start))
                  const end = o + (prev = INTERP.lastIndex)
                  ret.push(new Token(chunk, OLInterp, start, start + 2))
                  if (match[1]) {
                    const l1 = match[1].length
                    ret.push(
                      new Token(chunk, TIdent, start + 2, start + 2 + l1),
                    )
                    if (match[2]) {
                      const l2 = match[2].length
                      ret.push(
                        new Token(
                          chunk,
                          ODot,
                          start + 2 + l1,
                          start + 2 + l1 + l2,
                        ),
                      )
                      if (match[3]) {
                        const l3 = match[3].length
                        ret.push(
                          new Token(
                            chunk,
                            TIdent,
                            start + 2 + l1 + l2,
                            start + 2 + l1 + l2 + l3,
                          ),
                        )
                      }
                    }
                  }
                  ret.push(new Token(chunk, ORParen, end - 1, end))
                }
                ret.push(new Token(chunk, TSource, o + prev, i - 1))
                ret.push(new Token(chunk, ORBrace, i - 1, i))
                break loop
              } else {
                depth--
                break
              }
          }
        }
      } else {
        ret.push(new Token(chunk, OLBrace, start, ++i))
      }
      continue
    }

    if (cc in OPS_AND_SECOND_CHARS) {
      const next = source[i + 1]
      const nextcc = source.charCodeAt(i + 1)
      if (cc == C_STAR && nextcc == C_STAR) {
        issues.raise(
          Code.UseCaratAsExponentiationOperator,
          new Pos(i, i + 2, chunk),
        )
        ret.push(new Token(chunk, OCarat, i, i + 2, true))
        i += 2
        continue
      }
      if (next && OPS_AND_SECOND_CHARS[cc]!.has(nextcc)) {
        ret.push(new Token(chunk, OPS[char + next]!, start, i + 2))
        i += 2
        continue
      }
      i++
      if (char in OPS) {
        ret.push(new Token(chunk, OPS[char]!, start, i))
      } else {
        issues.raise(Code.UnknownOperator, new Pos(start, i, chunk))
      }
      continue
    }

    issues.raise(Code.UnknownChar, new Pos(start, ++i, chunk))
    continue
  }

  return ret
}
