import {
  performInit,
  type Cursor,
  type Init,
  type InitRet,
  type Selection,
} from "../../model"
import type { Options } from "../../options"

export class CmdMap<E> implements Init<E> {
  constructor(
    readonly fn: Init<E>,
    readonly tx: (input: string) => string,
  ) {}

  init(cursor: Cursor, input: string, options: Options, event: E): InitRet {
    return this.fn.init(cursor, this.tx(input), options, event)
  }

  initOn(
    selection: Selection,
    input: string,
    options: Options,
    event: E,
  ): InitRet {
    return performInit(this.fn, selection, this.tx(input), options, event)
  }
}
