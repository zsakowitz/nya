import { Command, L, R, type Cursor, type Dir } from "../../model"

/** A leaf is a specialized command with no children. */
export abstract class Leaf extends Command<[]> {
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

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards)
  }

  moveOutOf(): void {
    // Never called, since `Leaf` has no blocks
  }
}
