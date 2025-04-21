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
  type KindL,
} from "./kind"
import { Code, Issue, Token } from "./token"

export class TokenGroup<K extends KindL = KindL> extends Token<K> {
  constructor(
    readonly lt: Token<K>,
    readonly gt: Token<number>,
    readonly contents: Token<number>[],
  ) {
    super(lt.kind, lt.start, gt.end)
  }
}

type TokenGroupMut = {
  -readonly [K in keyof TokenGroup]: TokenGroup[K]
}

export function createGroups(raw: Token<number>[], issues: Issue[]) {
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
          token as Token<KindL>,
          new Token(MATCHING_PAREN[token.kind], 0, 0),
          [],
        )
        parens.push(group)
        currentContents.push(group)
        currentContents = group.contents
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
            if (MATCHING_PAREN[current.kind] == token.kind) {
              ;(current as TokenGroupMut).gt = token
              ;(current as TokenGroupMut).end = token.end
              continue main
            }
            ;(current as TokenGroupMut).gt = new Token(
              MATCHING_PAREN[current.kind],
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

    currentContents.push(token)
  }

  // check for remaining parens

  return root
}
