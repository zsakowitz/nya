import { Command, R, type Block, type Cursor, type Dir } from "../../model"

/** A leaf is a specialized command with no children. */
export abstract class Leaf extends Command<[]> {
  constructor(ctrlSeq: string, el: HTMLSpanElement) {
    super(ctrlSeq, el, [])
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards)
  }

  moveOutOf(): void {
    // Never called, since `Leaf` has no blocks
  }

  vertInto(): Block | undefined {
    return
  }

  vertFromSide(): Block | undefined {
    return
  }

  vertOutOf(): Block | true | undefined {
    return
  }

  delete(cursor: Cursor, from: Dir): void {
    if (cursor[R] == this) {
      cursor.moveTo(this, R)
    }
    this.remove()
  }

  deleteBlock(): void {
    // never happens
  }
}
