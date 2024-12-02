import type { WordKind } from "./cmd/leaf/var"
import type { Command, Init } from "./model"

/** Configuration for various behaviors of {@linkcode Command}s. */
export interface Options {
  /**
   * If this returns `true` for a given {@linkcode Command}, a number typed
   * directly after it will be turned into a subscript.
   */
  subscriptNumberAfter?(command: Command): boolean

  /** If `true`, letter substitution will still occur in subscripts. */
  autoCmdsInSubscripts?: boolean

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
   * An list of words which will be de-italicized. The {@linkcode WordKind} is
   * what kind of word the text will be treated as: variable, prefix operator,
   * or infix operator. The {@linkcode WordKind} controls spacing; see its
   * documentation for more details.
   */
  words?: WordMap<WordKind>
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
