import { createGroups } from "./group"
import { Code, Issue, Token, tokens, type ToTokensProps } from "./token"

export function parseStream(source: string, props: ToTokensProps) {
  const { issues, ret: raw } = tokens(source, props)
  const ret = createGroups(raw, issues)
  return new Stream(source, ret, issues)
}

export class Stream {
  constructor(
    readonly source: string,
    readonly tokens: Token<number>[],
    readonly issues: Issue[],
  ) {}

  issue(code: Code, start: number, end: number) {
    this.issues.push(new Issue(code, start, end))
  }

  content(token: { start: number; end: number }) {
    return this.source.slice(token.start, token.end)
  }

  match<K extends number>(k: K): Token<K> | null {
    const next = this.tokens[this.tokens.length - 1]
    if (next?.is(k)) {
      this.tokens.pop()
      return next
    } else {
      return null
    }
  }

  peek(): number | null {
    return this.tokens[this.tokens.length - 1]?.kind ?? null
  }
}
