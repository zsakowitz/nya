import { Code, Pos, type Issues } from "./issue"
import {
  MATCHING_PAREN,
  OGt,
  OLAngle,
  OLBrace,
  OLBrack,
  OLInterp,
  OLParen,
  OLt,
  ORAngle,
  ORBrace,
  ORBrack,
  ORParen,
  type Brack,
} from "./kind"
import { Token, tokens, type ToTokensProps } from "./token"

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
        ;(token as any).kind = OLAngle
      case OLParen:
      case OLBrack:
      case OLBrace:
      case OLInterp:
        const group = new TokenGroup(
          token as Token<Brack>,
          new Token(
            MATCHING_PAREN[token.kind as Brack],
            token.start,
            token.start,
          ),
          new Stream(source, [], issues, token.end, token.end),
        )
        parens.push(group)
        currentContents.push(group)
        currentContents = group.contents.tokens
        continue

      // @ts-expect-error intentional fallthrough
      case OGt:
        if (parens[parens.length - 1]?.kind != OLAngle) break
        ;(token as any).kind = ORAngle
      case ORParen:
      case ORBrack:
      case ORBrace:
        // If no current paren, ignore and move on
        if (!parens.some((x) => MATCHING_PAREN[x.kind] == token.kind)) {
          issues.raise(Code.MismatchedClosingParen, token)
          continue
        }

        let current = parens[parens.length - 1]!

        // Close parens until we match our kind. This is guaranteed to terminate
        // since we check for the 'none exist' case in the if statement above.
        while (MATCHING_PAREN[current.kind] != token.kind) {
          // Pop 'current' from the parentheses stack
          parens.pop()

          // Make sure all text positions are correct
          const mut = current as TokenGroupMut
          mut.gt = new Token(
            MATCHING_PAREN[current.kind],
            token.start,
            token.start,
            true,
          )
          mut.end = token.start
          mut.contents.end = token.start

          current = parens[parens.length - 1]!
          currentContents = current.contents.tokens
        }

        const mut = current as TokenGroupMut
        mut.gt = token
        mut.end = token.end
        mut.contents.end = token.start
        parens.pop()
        currentContents = parens[parens.length - 1]?.contents.tokens ?? root

        continue
    }

    currentContents.push(token)
  }

  for (const p of parens) {
    issues.raise(Code.MismatchedOpeningParen, p.lt)
  }

  return new Stream(source, root, issues, 0, source.length)
}

export class Stream {
  constructor(
    readonly source: string,
    readonly tokens: Token<number>[],
    readonly issues: Issues,
    readonly start: number,
    readonly end: number,
  ) {}

  index = 0

  private next() {
    return this.tokens[this.index]
  }

  raiseNext(code: Code) {
    let next = this.next()
    if (next instanceof TokenGroup) next = next.lt
    this.issues.raise(code, next ?? this)
  }

  private accept() {
    this.index++
  }

  loc() {
    return this.next()?.start ?? this.end
  }

  pos() {
    const loc = this.loc()
    return new Pos(loc, loc)
  }

  raise(code: Code, pos: Pos) {
    this.issues.raise(code, pos)
  }

  content(token: Pos) {
    return this.source.slice(token.start, token.end)
  }

  isEmpty() {
    return this.tokens.length == 0
  }

  isDone() {
    return this.index >= this.tokens.length
  }

  requireDone() {
    const token = this.next()
    if (token) {
      this.raise(Code.UnexpectedToken, token)
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

  /** If the passed token kind is matched, raises an error. */
  matchDrop<K extends number>(k: K, code: Code): Token<K> | null {
    const token = this.match(k)
    if (token) this.raiseNext(code)
    return token
  }

  /** If the passed token kind is not matched, raises an error. */
  matchOr<K extends number>(k: K, code: Code): Token<K> | null {
    const token = this.match(k)
    if (!token) this.raiseNext(code)
    return token
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

  full<T>(f: (stream: Stream) => T): T {
    const val = f(this)
    this.requireDone()
    return val
  }
}
