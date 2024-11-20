import { Command, L, R, type Cursor } from "../../model"

/** A token is a specialized command with no children. */
export abstract class Token extends Command<[]> {
  constructor(ctrlSeq: string, el: HTMLSpanElement) {
    super(ctrlSeq, el, [])
  }

  seek(clientX: number, cursor: Cursor) {
    const { left } = this.el.getBoundingClientRect()
    if (clientX - left < this.el.offsetWidth / 2) {
      cursor.moveTo(this, L)
    } else {
      cursor.moveTo(this, R)
    }
  }
}
