import type { CommandConstructor } from "../field"
import type { Cursor } from "../model"

export class ByRegex {
  readonly default

  constructor(
    readonly opts: readonly [RegExp, CommandConstructor][],
    defaultCmd?: CommandConstructor,
  ) {
    this.default = defaultCmd
  }

  createLeftOf(cursor: Cursor, input: string) {
    for (const [regex, cmd] of this.opts) {
      if (regex.test(input)) {
        cmd.createLeftOf(cursor, input)
        return
      }
    }
    this.default?.createLeftOf(cursor, input)
  }
}
