import type { Init } from "./model"

export interface Options {
  /**
   * If `true`, numbers typed directly after letters will be written as
   * subscripts.
   */
  autoSubscriptNumbers?: boolean

  /** If `true`, letter substitution will still occur in subscripts. */
  letterSubInSubscripts?: boolean

  /**
   * If any word from `autoCmds` is typed, it will be automatically initialized
   * using the appropriate {@link Init `Init`} instance.
   *
   * For instance, mapping `"sum"` to `CmdBig` will make it so that if the user
   * types `s` `u` `m`, it will be replaced by a summation symbol.
   *
   * The `Init` will be passed as input what has been typed, plus an initial
   * backslash.
   */
  autoCmds?: WordMap<Init>

  /**
   * An list of operator names which will be de-italicized. If the name is
   * declared as `1`, it will be treated as a prefix operator. Otherwise, it
   * will be treated as an infix operator.
   */
  autoOpNames?: WordMap<0 | 2>
}

export class WordMap<T> {
  private readonly words: Readonly<Record<string, T>> = Object.create(null)
  readonly maxLen

  constructor(words: [string, T][]) {
    let maxLen = 0
    for (const [key, value] of words) {
      ;(this.words as any)[key] = value
      maxLen = Math.max(maxLen, key.length)
    }
    this.maxLen = maxLen
  }

  set(word: string, value: T): this {
    ;(this as any).maxLen = Math.max(word.length, this.maxLen)
    ;(this.words as any)[word] = value
    return this
  }

  has(word: string): boolean {
    return word in this.words
  }

  get(word: string): T | undefined {
    return this.words[word]
  }

  getAll() {
    return Object.getOwnPropertyNames(this.words)
  }
}
