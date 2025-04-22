import {
  MATCHING_PAREN,
  OGt,
  OLBrace,
  OLBrack,
  OLInterp,
  OLParen,
  OLt,
  ORBrace,
  ORBrack,
  ORParen,
  type Brack,
} from "./kind"
import { Code, Issue, Token, tokens, type ToTokensProps } from "./token"

export class TokenGroup<K extends Brack = Brack> extends Token<K> {
  constructor(
    readonly lt: Token<K>,
    readonly gt: Token<number>,
    readonly contents: Stream,
  ) {
    super(lt.kind, lt.start, gt.end)
  }
}

type TokenGroupMut = {
  -readonly [K in keyof TokenGroup as K extends "contents" ? never
  : K]: TokenGroup[K]
} & { readonly contents: { -readonly [K in keyof Stream]: Stream[K] } }

export function createStream(source: string, props: ToTokensProps) {
  const { issues, ret: raw } = tokens(source, props)

  const parens: TokenGroup[] = []
  const root: Token<number>[] = []
  let currentContents: Token<number>[] = root

  main: for (let i = 0; i < raw.length; i++) {
    const token = raw[i]!

    switch (token.kind) {
      // @ts-expect-error intentional fallthrough
      case OLt:
        if (token.start !== raw[i - 1]?.end) break
      case OLParen:
      case OLBrack:
      case OLBrace:
      case OLInterp:
        const group = new TokenGroup(
          token as Token<Brack>,
          new Token(MATCHING_PAREN[token.kind], token.start, token.start),
          new Stream(source, [], issues, token.start, token.start),
        )
        parens.push(group)
        currentContents.push(group)
        currentContents = group.contents.tokens
        continue

      // @ts-expect-error intentional fallthrough
      case OGt:
        if (parens[parens.length - 1]?.kind != OLt) break
      case ORParen:
      case ORBrack:
      case ORBrace:
        const current = parens[parens.length - 1]

        // If no current paren, ignore and move on
        if (!current) {
          issues.push(
            new Issue(Code.MismatchedClosingParen, token.start, token.end),
          )
          continue
        }

        // If no match, close parens until we have a match
        if (MATCHING_PAREN[current.kind] != token.kind) {
          issues.push(
            new Issue(Code.MismatchedClosingParen, token.start, token.end),
          )

          issues.push(
            new Issue(
              Code.MismatchedOpeningParen,
              current.lt.start,
              current.lt.end,
            ),
          )
          ;(current as TokenGroupMut).gt = new Token(
            MATCHING_PAREN[current.kind],
            token.start,
            token.start,
            true,
          )
          ;(current as TokenGroupMut).end = token.start
          ;(current as TokenGroupMut).contents.end = token.end

          while (true) {
            parens.pop()
            const current = parens[parens.length - 1]
            currentContents = current?.contents.tokens ?? root
            if (!current) {
              continue main
            }
            issues.push(
              new Issue(
                Code.MismatchedOpeningParen,
                current.lt.start,
                current.lt.end,
              ),
            )
            if (MATCHING_PAREN[current.kind] == token.kind) {
              ;(current as TokenGroupMut).gt = token
              ;(current as TokenGroupMut).end = token.end
              ;(current as TokenGroupMut).contents.end = token.end
              continue main
            }
            ;(current as TokenGroupMut).gt = new Token(
              MATCHING_PAREN[current.kind],
              token.start,
              token.start,
              true,
            )
            ;(current as TokenGroupMut).end = token.start
            ;(current as TokenGroupMut).contents.end = token.start
          }
        }

        ;(current as TokenGroupMut).gt = token
        ;(current as TokenGroupMut).end = token.end
        ;(current as TokenGroupMut).contents.end = token.end
        parens.pop()
        currentContents = parens[parens.length - 1]?.contents.tokens ?? root
        continue
    }

    currentContents.push(token)
  }

  for (const p of parens) {
    issues.push(new Issue(Code.MismatchedOpeningParen, p.lt.start, p.lt.end))
  }

  return new Stream(source, root, issues, 0, source.length)
}

export class Stream {
  constructor(
    readonly source: string,
    readonly tokens: Token<number>[],
    readonly issues: Issue[],
    readonly start: number,
    readonly end: number,
  ) {}

  index = 0

  private next() {
    return this.tokens[this.index]
  }

  issueOnNext(code: Code) {
    const next = this.next()
    this.issues.push(
      new Issue(code, next?.start ?? this.end, next?.end ?? this.end),
    )
  }

  private accept() {
    this.index++
  }

  loc() {
    return this.next()?.start ?? this.end
  }

  issue(code: Code, start: number, end: number) {
    this.issues.push(new Issue(code, start, end))
  }

  content(token: { start: number; end: number }) {
    return this.source.slice(token.start, token.end)
  }

  isEmpty() {
    return this.tokens.length == 0
  }

  requireDone() {
    const token = this.next()
    if (token) {
      console.error(this.source.slice(this.start, this.end))
      this.issue(Code.UnexpectedToken, token.start, token.end)
    }
  }

  match<K extends number>(k: K): Token<K> | null {
    const next = this.next()
    if (next && next.kind == k) {
      this.accept()
      return next as Token<K>
    } else {
      return null
    }
  }

  matchGroup<K extends Brack>(k: K): TokenGroup<K> | null {
    const next = this.next()
    if (next && next instanceof TokenGroup && next.kind == k) {
      this.accept()
      return next as TokenGroup<K>
    } else {
      return null
    }
  }

  matchAny<const K extends readonly number[]>(k: K): Token<K[number]> | null {
    const next = this.next()
    if (next && k.includes(next.kind)) {
      this.accept()
      return next
    } else {
      return null
    }
  }

  peek(): number | null {
    return this.next()?.kind ?? null
  }
}
