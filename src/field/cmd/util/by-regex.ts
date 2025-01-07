import {
  performInit,
  type Cursor,
  type Init,
  type InitProps,
  type InitRet,
  type Selection,
} from "../../model"

export class ByRegex implements Init {
  readonly default

  constructor(
    readonly opts: readonly [RegExp, Init][],
    defaultCmd?: Init,
  ) {
    this.default = defaultCmd
  }

  init(cursor: Cursor, props: InitProps) {
    for (const [regex, cmd] of this.opts) {
      if (regex.test(props.input)) {
        return cmd.init(cursor, props)
      }
    }
    if (this.default) {
      return this.default.init(cursor, props)
    }
    return "browser"
  }

  initOn(selection: Selection, props: InitProps): InitRet {
    for (const [regex, cmd] of this.opts) {
      if (regex.test(props.input)) {
        return performInit(cmd, selection, props)
      }
    }
    if (this.default) {
      return performInit(this.default, selection, props)
    }
    return "browser"
  }
}
