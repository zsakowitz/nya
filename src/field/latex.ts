import type { Ctx } from "@/sheet/deps"
import { CmdEOF } from "./cmd/leaf/eof"
import { CmdUnknown } from "./cmd/leaf/unknown"
import type { FieldInert } from "./field-inert"
import { Block, L, R, type Command } from "./model"
import { WordMap, type Options } from "./options"

export interface LatexInit {
  fromLatex(cmd: string, parser: LatexParser): Command | Block
}

/**
 * A set of LaTeX environments which can be used in `\begin{...}` commands. Also
 * a {@linkcode LatexInit}.
 */
export class LatexEnvs extends WordMap<LatexInit> implements LatexInit {
  fromLatex(_cmd: string, parser: LatexParser): Command | Block {
    const kind = parser.text()
    const env = this.get(kind)
    if (env) {
      return env.fromLatex(`\\begin{${kind}}`, parser)
    } else {
      return new CmdUnknown(`\\begin{${kind}}`)
    }
  }
}

export class LatexParser {
  private readonly cmds: WordMap<LatexInit>

  constructor(
    readonly options: Options,
    readonly ctx: Ctx,
    private readonly source: string,
    readonly field: FieldInert | null,
  ) {
    this.cmds = options.latex || new WordMap([])
  }

  _i = 0
  get i() {
    return this._i
  }
  set i(v) {
    this._i = v
  }

  /** Consumes whitespace. */
  ws() {
    while (this.source[this.i]?.match(/^\s$/)) {
      this.i++
    }
  }

  /** This still consumes whitespace. */
  peek() {
    this.ws()
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
  argMaybe(next = this.peek(), into?: Block): Block | undefined {
    if (!next) return
    if (next == "}") return
    if (next == "{") {
      this.i += next.length
      return this.until("}", undefined, into)
    }
    this.i += next.length
    const cmd = this.cmds.get(next)
    into ??= new Block(null)
    const c = into.cursor(R)
    ;(cmd ? cmd.fromLatex(next, this) : new CmdUnknown(next)).insertAt(c, L)
    return into
  }

  /**
   * If `this.argMaybe()` would succeed, returns the result. Otherwise, returns
   * a {@linkcode Block} containing a signle {@linkcode CmdEOF}.
   */
  arg(into?: Block): Block {
    return this.argMaybe(undefined, into) ?? CmdEOF.block("any value")
  }

  /**
   * Consumes until the token `end` is found, then also consumes `end`. If
   * `allowTermination` is not true and the end token is never reached (e.g. the
   * source ends unexpectedly), a {@linkcode CmdEOF} will be inserted.
   */
  until(end: string, allowTermination?: boolean, into?: Block): Block {
    into ??= new Block(null)
    let next
    while ((next = this.peek())) {
      if (next == end) {
        this.i += next.length
        return into
      }
      const arg = this.argMaybe(next)
      if (!arg) break
      into.insert(arg, into.ends[R], null)
    }
    if (!allowTermination) {
      new CmdEOF(end).insertAt(into.cursor(R), L)
    }
    return into
  }

  /**
   * Consumes until the token `end` is found, then also consumes `end`, and
   * returns both. If the end of the source is reached, `null` is returned as
   * the second argument.
   */
  untilAny<T extends string>(end: readonly T[]): [Block, T | null] {
    const inner = new Block(null)
    let next
    while ((next = this.peek())) {
      if ((end as readonly string[]).indexOf(next) != -1) {
        this.i += next.length
        return [inner, next as T]
      }
      const arg = this.argMaybe(next)
      if (!arg) break
      inner.insert(arg, inner.ends[R], null)
    }
    return [inner, null]
  }

  /**
   * Parses until a `\end{<kind>}` is found, returning the parsed blocks as a
   * grid. These characters have special meaning in the block:
   *
   * - `&` denotes a column break
   * - `\\` denotes a row break
   * - `\end{<kind>}` denotes the proper end of the env
   * - `\end{<other kind>}` and `}` are errors
   *
   * Where `&` denotes a new column and `\\` denotes a new row. If a `\end` tag
   * is found but it is not the correct one, it is inserted as a CmdUnknown and
   * allowed to pass. The token `}` does not have any special meaning in an
   * environment.
   */
  env(kind: string, maxRowSize = 0): Block[][] {
    if (kind.startsWith("\\begin{") && kind.endsWith("}")) {
      kind = kind.slice(7, -1)
    }
    let row: Block[] = []
    const grid = [row]
    let prepend: Block | 0 | undefined

    loop: while (true) {
      const [block, tag] = this.untilAny(["&", "\\\\", "\\end", "}"])
      if (!tag) {
        if (prepend) {
          row.push(prepend)
        }
        row.push(CmdEOF.block(`\\end{${kind}}`))
        break loop
      }
      if (prepend) {
        block.insert(prepend, null, block.ends[L])
        prepend = 0
      }
      switch (tag) {
        case "&":
          push(block)
          break
        case "\\\\":
          push(block)
          grid.push((row = []))
          break
        case "}":
          new CmdUnknown("}").insertAt(block.cursor(R), L)
          prepend = block
          break
        case "\\end":
          const label = this.text()
          push(block)
          if (label == kind) {
            break loop
          } else {
            new CmdUnknown(`\\end{${label}}`).insertAt(block.cursor(R), L)
            prepend = block
            break
          }
      }
    }

    if (row.length == 0) {
      grid.pop()
    }

    return grid

    function push(block: Block) {
      if (!maxRowSize || !row.length || row.length < maxRowSize) {
        row.push(block)
        return
      }
      const last = row[row.length - 1]!
      new CmdUnknown("&").insertAt(last.cursor(R), L)
      last.insert(block, last.ends[R], null)
    }
  }

  /**
   * Consumes a block of text. Either a single character, or a curly-brace
   * demarcated block of characters.
   */
  text() {
    this.ws()
    if (this.source[this.i] == "{") {
      let ret = ""
      this.i++
      while (this.source[this.i] && this.source[this.i] != "}") {
        if (this.source[this.i] == "\\") {
          ret += this.source[this.i + 1]
          this.i += 2
        } else {
          ret += this.source[this.i]
          this.i++
        }
      }
      this.i++
      return ret
    } else if (this.source[this.i] == "\\") {
      this.i += 2
      return this.source[this.i - 1] || ""
    } else {
      return this.source[this.i++] || ""
    }
  }

  parse(): Block {
    return this.until("", true)
  }
}

export function toText(text: string) {
  let ret = ""
  for (const char of text) {
    ret += char == "}" || char == "{" || char == "\\" ? "\\" + char : char
  }
  return ret
}
