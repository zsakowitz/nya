import { Leaf } from "."
import { h, t } from "../../jsx"
import { Cursor, L, R, Span, type Dir } from "../../model"
import type { Options } from "../../options"

/**
 * The different kinds of {@linkcode CmdVar}-composed words which exist. These
 * affect punctuation and parentheses.
 *
 * - `"var"` is suitable for variables like Desmos's `width` and `height`
 * - `"prefix"` is suitable for functions like `sin` and `cos`
 * - `"infix"` is suitable for operators like `for` and `with`
 *
 * Spacing of plus/minus signs and parentheses are specified below:
 *
 * - `"var"`: `+word` `2 + word` `word + 2` `(...)word(...)`
 * - `"prefix"`: `+word` `2 + word` `word +2` `(...) word(...)`
 * - `"infix"`: `2 + word` `word +2` `(...) word (...)`
 */
export type WordKind = "var" | "prefix" | "infix"

export class CmdVar extends Leaf {
  static init(
    cursor: Cursor,
    input: string,
    options: Options,
    event: KeyboardEvent | undefined,
  ) {
    const self = new CmdVar(input)
    self.insertAt(cursor, L)

    if (options.autoCmds) {
      const cmds = options.autoCmds
      const maxLen = cmds.maxLen
      if (!maxLen) return

      // Gather as many `CmdVar`s as possible (but only up to `maxLen`)
      let leftmost = self
      const text = [self.text]
      while (leftmost[L] instanceof CmdVar && text.length < maxLen) {
        leftmost = leftmost[L]
        text.unshift(leftmost.text)
      }

      // Try each combination
      while (text.length) {
        const word = text.join("")
        if (cmds.has(word)) {
          const cmd = cmds.get(word)!
          new Span(cursor.parent, leftmost[L], self[R]).remove()
          cmd.init(cursor, "\\" + word, options, event)
          return
        }

        text.shift()
        leftmost = leftmost[R] as CmdVar
      }
    }
  }

  readonly kind: WordKind | null = null
  readonly part: Dir | null = null

  static render(text: string, kind: CmdVar["kind"], part: CmdVar["part"]) {
    return h(
      "",
      h("font-['Times'] [line-height:.9]" + (kind ? "" : " italic"), t(text)),
    )
  }

  constructor(readonly text: string) {
    // The wrapper ensures selections work fine
    super(text, CmdVar.render(text, null, null))
  }

  private render(kind = this.kind, part = this.part) {
    this.setEl(
      CmdVar.render(
        this.text,
        ((this as any).kind = kind),
        ((this as any).part = part),
      ),
    )
  }

  ascii(): string {
    return this.text
  }

  latex(): string {
    return this.text
  }

  reader(): string {
    return this.text
  }
}
