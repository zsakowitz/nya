import { Code, Issue, Kind, Token, tokens, type ToTokensProps } from "./token"

export class TokenGroup extends Token<Kind.Group> {
  constructor(
    readonly lt: Token<Kind.Op>,
    readonly gt: Token<Kind.Op>,
    readonly text: "(" | "[" | "{" | "<" | "$(",
    readonly contents: Token<Kind>[],
  ) {
    super(Kind.Group, lt.start, gt.end)
  }
}

type TokenGroupMut = { -readonly [K in keyof TokenGroup]: TokenGroup[K] }

function matches(group: TokenGroup, rhs: ")" | "]" | "}" | ">") {
  return (
    rhs == ")" ? group.text == "(" || group.text == "$("
    : rhs == "]" ? group.text == "["
    : rhs == "}" ? group.text == "{"
    : rhs == ">" ? group.text == "<"
    : false
  )
}

export function parseStream(source: string, props: ToTokensProps) {
  const { issues, ret: raw } = tokens(source, props)

  const parens: TokenGroup[] = []
  const root: Token<Kind>[] = []
  let currentContents: Token<Kind>[] = root

  main: for (let i = 0; i < raw.length; i++) {
    const token = raw[i]!

    if (token.is(Kind.Op)) {
      const text = source.slice(token.start, token.end)

      if (
        text == "(" ||
        text == "$(" ||
        text == "[" ||
        text == "{" ||
        // angle brackets are also less than and greater than, so we mandate no whitespace for them
        (text == "<" && token.start == (raw[i - 1]?.end ?? 0))
      ) {
        const group = new TokenGroup(token, new Token(Kind.Op, 0, 0), text, [])
        parens.push(group)
        currentContents.push(group)
        currentContents = group.contents
        continue
      }

      if (
        text == ")" ||
        text == "]" ||
        text == "}" ||
        (text == ">" && parens[parens.length - 1]?.text == "<")
      ) {
        const current = parens[parens.length - 1]

        // If no current paren, ignore and move on
        if (!current) {
          issues.push(
            new Issue(Code.MismatchedClosingParen, token.start, token.end),
          )
          continue
        }

        // If no match, close parens until we have a match
        if (!matches(current, text)) {
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
            Kind.Op,
            token.start,
            token.start,
            true,
          )
          ;(current as TokenGroupMut).end = token.start

          while (true) {
            parens.pop()
            const current = parens[parens.length - 1]
            currentContents = current?.contents ?? root
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
            if (matches(current, text)) {
              ;(current as TokenGroupMut).gt = token
              ;(current as TokenGroupMut).end = token.end
              continue main
            }
            ;(current as TokenGroupMut).gt = new Token(
              Kind.Op,
              token.start,
              token.start,
              true,
            )
            ;(current as TokenGroupMut).end = token.start
          }
        }

        ;(current as TokenGroupMut).gt = token
        ;(current as TokenGroupMut).end = token.end
        parens.pop()
        currentContents = parens[parens.length - 1]?.contents ?? root
        continue
      }
    }

    currentContents.push(token)
  }

  return new Stream(source, root, issues)
}

export class Stream {
  constructor(
    readonly source: string,
    readonly tokens: Token<Kind>[],
    readonly issues: Issue[],
  ) {}

  issue(code: Code, start: number, end: number) {
    this.issues.push(new Issue(code, start, end))
  }

  content(token: { start: number; end: number }) {
    return this.source.slice(token.start, token.end)
  }
}
