import type { Cursor, Init } from "../../model"
import type { Options } from "../../options"

export class ByRegex implements Init {
  readonly default

  constructor(
    readonly opts: readonly [RegExp, Init][],
    defaultCmd?: Init,
  ) {
    this.default = defaultCmd
  }

  init(
    cursor: Cursor,
    input: string,
    options: Options,
    event: KeyboardEvent | undefined,
  ) {
    for (const [regex, cmd] of this.opts) {
      if (regex.test(input)) {
        cmd.init(cursor, input, options, event)
        return
      }
    }
    this.default?.init(cursor, input, options, event)
  }
}
