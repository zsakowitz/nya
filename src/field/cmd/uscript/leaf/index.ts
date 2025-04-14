import { L, R, type Dir, type VDir } from "@/field/sides"
import { Command, type Block, type Cursor } from "../../../model"

export abstract class CmuLeaf extends Command<[]> {
  constructor(ctrlSeq: string, html: HTMLSpanElement) {
    super(ctrlSeq, html, [])
  }

  focus(x: number, _y: number): Cursor {
    const [lhs, rhs] = this.bounds()
    return this.cursor(x < (lhs + rhs) / 2 ? L : R)
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards)
  }

  delete(cursor: Cursor, _from: Dir): void {
    if (cursor[R] == this) {
      cursor.moveTo(this, R)
    }
    this.remove()
  }

  moveOutOf(_cursor: Cursor, _towards: Dir, _block: Block): void {}
  vertFromSide(_dir: VDir, _from: Dir): undefined {}
  vertInto(_dir: VDir, _clientX: number): undefined {}
  vertOutOf(_dir: VDir, _block: Block, _cursor: Cursor): undefined {}
}
