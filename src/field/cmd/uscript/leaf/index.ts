import { h, usvg, type ViewBox } from "../../../jsx"
import {
  Command,
  L,
  R,
  type Block,
  type Cursor,
  type Dir,
  type InitRet,
  type VDir,
} from "../../../model"

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

  delete(cursor: Cursor, from: Dir): void {
    if (cursor[R] == this) {
      cursor.moveTo(this, R)
    }
    this.remove()
  }

  moveOutOf(cursor: Cursor, towards: Dir, block: Block): void {}
  vertFromSide(dir: VDir, from: Dir): undefined {}
  vertInto(dir: VDir, clientX: number): undefined {}
  vertOutOf(dir: VDir, block: Block, cursor: Cursor): undefined {}
}

export function leaf(
  classes: string,
  viewBox: ViewBox,
  path: string,
  latex: string,
  reader: string,
  ascii: string,
) {
  return class extends CmuLeaf {
    static init(cursor: Cursor): InitRet {
      new this().insertAt(cursor, L)
    }

    ascii(): string {
      return ascii
    }

    reader(): string {
      return reader
    }

    latex(): string {
      return latex
    }

    constructor() {
      super(latex, h("", usvg(classes, viewBox, path)))
    }
  }
}
