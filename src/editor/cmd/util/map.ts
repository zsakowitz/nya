import {
  performInit,
  type Cursor,
  type Init,
  type InitProps,
  type InitRet,
  type Selection,
} from "../../model"

export class CmdMap<E> implements Init<E> {
  constructor(
    readonly fn: Init<E>,
    readonly tx: (input: string) => string,
  ) {}

  init(cursor: Cursor, props: InitProps<E>): InitRet {
    return this.fn.init(cursor, { ...props, input: this.tx(props.input) })
  }

  initOn(selection: Selection, props: InitProps<E>): InitRet {
    return performInit(this.fn, selection, {
      ...props,
      input: this.tx(props.input),
    })
  }
}
