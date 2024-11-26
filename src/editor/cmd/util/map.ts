import type { Cursor, Init, InitRet, Selection } from "../../model"
import type { Options } from "../../options"

export class CmdMap<E> implements Init<E> {
  constructor(
    readonly fn: Init<E>,
    readonly tx: (input: string) => string,
  ) {
    if (!fn.initOn) {
      this.initOn = undefined
    }
  }

  init(cursor: Cursor, input: string, options: Options, event: E): InitRet {
    return this.fn.init(cursor, this.tx(input), options, event)
  }

  initOn?(
    selection: Selection,
    input: string,
    options: Options,
    event: E,
  ): InitRet {
    return this.fn.initOn!(selection, this.tx(input), options, event)
  }
}
