import {
  performInit,
  type Cursor,
  type Init,
  type InitRet,
  type Selection,
} from "../../model"
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
        return cmd.init(cursor, input, options, event)
      }
    }
    return this.default?.init(cursor, input, options, event)
  }

  initOn(
    selection: Selection,
    input: string,
    options: Options,
    event: KeyboardEvent | undefined,
  ): InitRet {
    for (const [regex, cmd] of this.opts) {
      if (regex.test(input)) {
        return performInit(cmd, selection, input, options, event)
      }
    }
    if (this.default) {
      return performInit(this.default, selection, input, options, event)
    }
  }
}
