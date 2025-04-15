import type { WordKind } from "./cmd/leaf/var"
import type { CmdSupSub } from "./cmd/math/supsub"
import type { LatexInit } from "./latex"
import type { Command, Cursor, Init } from "./model"

/** A container for various initializables. */
export class Inits {
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
    const inits = new Inits()
    inits.default = this.default
    ;(inits as any).cmds = { ...this.cmds }
    return inits
  }
}

/** A map from strings to values. Caches the maximum word length. */
export class WordMap<T> {
  private readonly words: Readonly<Record<string, T>> = Object.create(null)
  private readonly default?: T
  readonly maxLen

  constructor(words: (readonly [string, T])[], defaultValue?: T) {
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

  init(word: string, value: T): this {
    if (this.has(word) && this.get(word) !== value) {
      console.warn(`[wordmap] '${word}' set with different values`)
    }
    return this.set(word, value)
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
    const map = new WordMap<T>([])
    ;(map as any).maxLen = this.maxLen
    ;(map as any).words = { __proto__: null, ...this.words }
    return map
  }
}

export type Despace<T extends string> =
  T extends `${infer A} ${infer B}` ? `${A}${Despace<B>}` : T

export function despace<K extends string>(t: K): Despace<K> {
  return t.replace(/ /g, "") as any
}

/**
 * A map from strings to values. Caches the maximum word length. Words with
 * spaces are stored without spaces, but their original spaced versions may
 * still be accessed.
 */
export class WordMapWithoutSpaces<T> extends WordMap<T> {
  /**
   * If a word has a space, the spaces are removed and the original is stuffed
   * here.
   */
  private spaced: Record<string, string> = Object.create(null)

  constructor(words: (readonly [string, T])[], defaultValue?: T) {
    super(
      words.map(([k, v]) => [despace(k), v] as const),
      defaultValue,
    )

    for (const [k] of words) {
      if (k.includes(" ")) {
        this.spaced[despace(k)] = k
      }
    }
  }

  clone() {
    const map = new WordMapWithoutSpaces<T>([])
    ;(map as any).maxLen = this.maxLen
    ;(map as any).words = { __proto__: null, ...(this as any).words }
    ;(map as any).spaced = { __proto__: null, ...(this as any).spaced }
    return map
  }

  init(spaced: string, value: T): this {
    const despaced = despace(spaced)
    if (this.has(despaced) && this.get(despaced) !== value) {
      console.warn(`[wordmap] '${despaced}' set with different values`)
    }
    return this.set(spaced, value)
  }

  get(word: string): T | undefined {
    return super.get(despace(word))
  }

  has(word: string): boolean {
    return super.has(despace(word))
  }

  set(word: string, value: T): this {
    super.set(despace(word), value)
    if (word.includes(" ")) {
      this.spaced[despace(word)] = word
    }
    return this
  }

  withSpaces(unspaced: string): string | null {
    return this.spaced[unspaced] ?? null
  }

  /**
   * Returns an array of indices in the word with spaces. For instance, if
   * `"hipeopleofearth"` is passed and `[2, 8, 10]` is returned, there are
   * spaces as in `"hi people of earth"`.
   */
  spaceIndices(unspaced: string): readonly number[] | null {
    let spaced = this.withSpaces(unspaced)
    if (!spaced) return null

    const indices = []
    let i = 0
    for (const el of spaced.split(" ")) {
      i += el.length
      indices.push(i)
    }
    indices.pop()
    return indices
  }
}

/** Configuration for various behaviors of math fields. */
export interface Options {
  /** Characters and LaTeX commands which can be typed. */
  inits?: Inits

  /** Characters which can be typed as part of Ctrl/Cmd shortcuts. */
  shortcuts?: Inits

  /**
   * If any word from `autos` is typed, it will be automatically initialized
   * using the appropriate {@link Init `Init`} instance.
   *
   * For instance, mapping `"sum"` to `CmdBig` will make it so that if the user
   * types `s` `u` `m`, it will be replaced by a summation symbol.
   *
   * The `Init` will be passed as input what has been typed, plus an initial
   * backslash.
   */
  autos?: WordMap<Init>

  /**
   * A list of LaTeX commands and characters to accept when pasting LaTeX text.
   * Should match the LaTeX outputted by all commands.
   *
   * If not present, pasting will not be supported.
   */
  latex?: WordMap<LatexInit>

  /**
   * An list of words which will be de-italicized. The {@linkcode WordKind} is
   * what kind of word the text will be treated as: variable, prefix operator,
   * or infix operator. The {@linkcode WordKind} controls spacing; see its
   * documentation for more details.
   */
  words?: WordMapWithoutSpaces<WordKind>

  /**
   * If this returns `true` for a given {@linkcode Command}, a number typed
   * directly after it will be turned into a subscript.
   */
  subscriptNumberAfter?(command: Command): boolean

  /** If `true`, letter substitution will still occur in subscripts. */
  autoCmdsInSubscripts?: boolean

  /**
   * If this returns `true`, words will still be created in the given subscript
   * block.
   */
  wordsInSubscript?(command: CmdSupSub): boolean

  /** If `true`, typing a `CmdOp` in a subscript will exit the subscript. */
  exitSubWithOp?: boolean

  /** If `true`, typing a `CmdPm` in a superscript will exit the superscript. */
  exitSupWithPm?: boolean

  /** If `true`, integrals will default to having no bounds. */
  noAutoIntBound?: boolean

  /** If `true`, big symbols will default to having no upper bound. */
  noAutoBigBound?: boolean

  /**
   * Called before inserting a value into an expression. Should only insert
   * things around the cursor.
   */
  beforeInsert?(cursor: Cursor): void

  /**
   * Called after inserting a value into an expression. Not called when
   * previewing an inserted value.
   */
  afterInsert?(cursor: Cursor): void
}
