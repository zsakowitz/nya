import type { Cursor, Init } from "../model"

export class ByRegex implements Init {
  readonly default

  constructor(
    readonly opts: readonly [RegExp, Init][],
    defaultCmd?: Init,
  ) {
    this.default = defaultCmd
  }

  init(cursor: Cursor, input: string, event: KeyboardEvent | undefined) {
    for (const [regex, cmd] of this.opts) {
      if (regex.test(input)) {
        cmd.init(cursor, input, event)
        return
      }
    }
    this.default?.init(cursor, input, event)
  }
}
