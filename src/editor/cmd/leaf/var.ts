import { Leaf } from "."
import { h, t } from "../../jsx"
import { Cursor, L, R, Span } from "../../model"
import type { Options } from "../../options"

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

  constructor(readonly text: string) {
    // The wrapper ensures selections work fine
    super(text, h("", h("italic font-['Times'] [line-height:.9]", t(text))))
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
