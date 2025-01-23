import { CmdUnknown } from "./cmd/leaf/unknown"
import { Block, L, R, type Command } from "./model"
import type { Options, WordMap } from "./options"

export interface LatexInit {
  fromLatex(cmd: string, parser: LatexParser): Command | Block
}

export class LatexParser {
  constructor(
    private readonly cmds: WordMap<LatexInit>,
    readonly options: Options,
    private readonly source: string,
  ) {}

  _i = 0
  get i() {
    return this._i
  }
  set i(v) {
    this._i = v
  }

  /** This still consumes whitespace. */
  peek() {
    while (this.source[this.i]?.match(/^\s$/)) {
      this.i++
    }
    const char = this.source[this.i]
    if (char !== "\\") {
      return char
    }

    let next = this.source[this.i + 1]
    if (!next) {
      return "\\"
    } else if (!/^[A-Za-z]$/.test(next)) {
      return "\\" + next
    }

    let i = this.i + 2
    let word = "\\" + next
    while ((next = this.source[i]) && /^[A-Za-z]$/.test(next)) {
      word += next
      i++
    }

    return word
  }

  /**
   * Consumes a single LaTeX argument. If an argument is passed, it will be
   * assumed to be a cached call to `this.peek()`.
   *
   * `undefined` is only returned if `next` is `undefined` or `"}"`.
   */
  argMaybe(next = this.peek()): Block | undefined {
    if (!next) return
    if (next == "}") return
    if (next == "{") {
      this.i += next.length
      return this.until("}")
    }
    this.i += next.length
    const cmd = this.cmds.get(next)
    if (cmd) {
      const block = new Block(null)
      cmd.fromLatex(next, this).insertAt(block.cursor(R), L)
      return block
    }
    const block = new Block(null)
    new CmdUnknown(next).insertAt(block.cursor(R), L)
    return block
  }

  /** Shorthand for `this.argMaybe() ?? new Block(null)`. */
  arg(): Block {
    return this.argMaybe() ?? new Block(null)
  }

  /** Consumes until the token `end` is found, then also consumes `end`. */
  until(end: string): Block {
    const inner = new Block(null)
    let next
    while ((next = this.peek())) {
      if (next == end) {
        this.i += next.length
        return inner
      }
      inner.insert(this.argMaybe(next)!, inner.ends[R], null)
    }
    return inner
  }

  parse(): Block {
    return this.until("")
  }
}
