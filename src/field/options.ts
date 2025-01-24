import type { WordKind } from "./cmd/leaf/var"
import type { LatexInit } from "./latex"
import type { Command, Init } from "./model"

/** A container for various initializables. */
export class Exts {
  private readonly cmds: { [x: string]: Init } = Object.create(null)
  private default?: Init

  getAll(): string[] {
    return Object.getOwnPropertyNames(this.cmds)
  }

  set(name: string, cmd: Init) {
    this.cmds[name] = cmd
    return this
  }

  setAll(names: string[], cmd: Init) {
    for (const name of names) {
      this.cmds[name] = cmd
    }
    return this
  }

  setDefault(cmd: Init) {
    this.default = cmd
    return this
  }

  get(text: string) {
    return this.cmds[text] || this.default
  }

  freeze() {
    Object.freeze(this)
    Object.freeze(this.cmds)
    return this
  }

  clone() {
    const exts = new Exts()
    exts.default = this.default
    ;(exts as any).cmds = { ...this.cmds }
    return exts
  }
}

/** A map from strings to values. Caches the maximum word length. */
export class WordMap<T> {
  private readonly words: Readonly<Record<string, T>> = Object.create(null)
  private readonly default?: T
  readonly maxLen

  constructor(words: [string, T][], defaultValue?: T) {
    this.default = defaultValue
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
    return this.words[word] ?? this.default
  }

  getAll() {
    return Object.getOwnPropertyNames(this.words)
  }

  freeze() {
    Object.freeze(this)
    Object.freeze(this.words)
    return this
  }

  clone() {
    const map = new WordMap([])
    ;(map as any).maxLen = this.maxLen
    ;(map as any).words = { ...this.words }
    return map
  }
}

/** Configuration for various behaviors of {@linkcode Command}s. */
export interface Options {
  /**
   * If this returns `true` for a given {@linkcode Command}, a number typed
   * directly after it will be turned into a subscript.
   */
  subscriptNumberAfter?(command: Command): boolean

  /** If `true`, letter substitution will still occur in subscripts. */
  autoCmdsInSubscripts?: boolean

  /** If `true`, typing a `CmdOp` in a subscript will exit the subscript. */
  exitSubWithOp?: boolean

  /** If `true`, typing a `CmdPm` in a superscript will exit the superscript. */
  exitSupWithPm?: boolean

  /** If `true`, integrals will default to having no bounds. */
  noAutoIntBound?: boolean

  /** If `true`, big symbols will default to having no upper bound. */
  noAutoBigBound?: boolean

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

  /**
   * A list of LaTeX commands and characters to accept when pasting LaTeX text.
   * Should match the LaTeX outputted by all commands.
   *
   * If not present, pasting will not be supported.
   */
  latexCmds?: WordMap<LatexInit>
}
