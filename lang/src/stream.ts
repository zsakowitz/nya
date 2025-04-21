import type { Comma, Delimited, Kw, PDelim } from "./ast"
import { Code, Issue, Kind, tokens, type Keyword, type Token } from "./token"

export function parseStream(source: string) {
  const { issues, ret } = tokens(source)
  return new Stream(source, ret.reverse(), issues)
}

export class Stream {
  constructor(
    readonly source: string,
    readonly tokens: Token<Kind>[],
    readonly issues: Issue[],
  ) {}

  get next() {
    return this.tokens[this.tokens.length - 1]
  }

  issue(code: Code, start: number, end: number) {
    this.issues.push(new Issue(code, start, end))
  }

  content(token: Token<Kind>) {
    return this.source.slice(token.start, token.end)
  }

  has<K extends Kind, T extends string>(
    token: Token<K>,
    value: T,
  ): token is Token<K, T> {
    return this.content(token) == value
  }

  is<K extends Kind, T extends string>(
    token: Token<Kind>,
    value: T,
  ): token is Token<K, T> {
    return this.content(token) == value
  }

  require<K extends readonly Kind[], const T extends readonly string[]>(
    kinds: K,
    values?: T,
  ): Token<K[number], T[number]> | null {
    const token = this.tokens.pop()
    if (!token) {
      return null
    }

    if (!kinds.includes(token.kind)) {
      this.issue(Code.UnexpectedTokenKind, token.start, token.end)
      this.tokens.push(token)
      return null
    }

    if (values && !values.includes(this.content(token))) {
      this.issue(Code.UnexpectedTokenValue, token.start, token.end)
      this.tokens.push(token)
      return null
    }

    return token
  }

  try<K extends readonly Kind[], const T extends readonly string[]>(
    kinds: K,
    values?: T,
  ): Token<K[number], T[number]> | null {
    const token = this.tokens.pop()
    if (!token) {
      return null
    }

    if (!kinds.includes(token.kind)) {
      this.tokens.push(token)
      return null
    }

    if (values && !values.includes(this.content(token))) {
      this.tokens.push(token)
      return null
    }

    return token
  }

  comma() {
    if (this.next?.is(Kind.Op) && this.has(this.next, ",")) {
      this.tokens.pop()
      return this.next
    } else {
      return null
    }
  }

  op<const T extends readonly string[]>(op: T) {
    return this.require([Kind.Op], op)
  }

  attrs<const T extends readonly Keyword[]>(
    words: T,
  ): PDelim<Kw<T[number]>> | null {
    if (!(this.next?.is(Kind.Op) && this.has(this.next, "("))) {
      return null
    }

    const lt = this.next
    const value = this.delim(() => this.try([Kind.Kw], words))
    const gt = this.require([Kind.Op], [")"])

    return { lt, value, gt }
  }

  delim<T extends {}>(f: () => T | null): Delimited<T> {
    const items: T[] = []
    const delims: Comma[] = []

    const first = f()
    if (first != null) {
      items.push(first)

      while (true) {
        const c = this.comma()
        if (c == null) break
        delims.push(c)

        const item = f()
        if (item == null) break
        items.push(item)
      }
    }

    return { items, delims }
  }
}
