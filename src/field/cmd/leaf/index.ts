import { L, R, type Dir } from "@/field/dir"
import { Command, Cursor, type Block } from "../../model"

export function focusEdge(command: Command, x: number) {
  const [lhs, rhs] = command.bounds()
  return command.cursor(x < (lhs + rhs) / 2 ? L : R)
}

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

  delete(cursor: Cursor, _from: Dir): void {
    if (cursor[R] == this) {
      cursor.moveTo(this, R)
    }
    this.remove()
  }

  deleteBlock(): void {
    // Never called, since `Leaf` has no blocks
  }

  focus(x: number, _y: number): Cursor {
    return focusEdge(this, x)
  }
}
