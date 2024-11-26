import { D, L, R, U, type Dir, type Init, type VDir } from "../../model"

export type InitControl = Init

export function CmdMove(
  dirMove: Dir | VDir,
  dirSelect: Dir = dirMove == L || dirMove == U ? L : R,
): InitControl {
  if (dirMove == U || dirMove == D) {
    return {
      init(cursor, _, ev) {
        if (ev?.shiftKey) {
          const sel = cursor.selection()
          sel.moveFocusFast(dirSelect)
          return sel
        } else {
          cursor.moveVert(dirMove)
        }
      },
      initOn(selection, _, event) {
        if (event?.shiftKey) {
          selection.moveFocusFast(dirSelect)
        }
      },
    }
  } else {
    return {
      init(cursor, _, ev) {
        if (ev?.shiftKey) {
          const sel = cursor.selection()
          sel.moveFocus(dirSelect)
          return sel
        } else {
          cursor.move(dirMove)
        }
      },
      initOn(selection, _, event) {
        if (event?.shiftKey) {
          selection.moveFocus(dirSelect)
        } else {
          return selection.cursor(dirMove)
        }
      },
    }
  }
}

export const CmdBackspace: InitControl = {
  init(cursor) {
    cursor.delete(L)
  },
  initOn(selection) {
    selection.remove()
  },
}

export const CmdDel: InitControl = {
  init(cursor) {
    cursor.delete(R)
  },
  initOn(selection) {
    selection.remove()
  },
}

export const CmdTab: InitControl = {
  init(cursor, _, event) {
    const dir = event?.shiftKey ? L : R
    if (!cursor.parent) {
      return
    }
    if (!cursor.parent.parent) {
      return
    }
    const index = cursor.parent.parent.blocks.indexOf(cursor.parent)
    if (index == 0 && dir == L) {
      cursor.moveTo(cursor.parent.parent, L)
    } else if (dir == R && index == cursor.parent.parent.blocks.length - 1) {
      cursor.moveTo(cursor.parent.parent, R)
    } else {
      cursor.moveIn(cursor.parent.parent.blocks[index + dir]!, dir == L ? R : L)
    }
  },
  initOn(sel, _, event) {
    const dir = event?.shiftKey ? L : R
    const cursor = sel.cursor(dir)
    CmdTab.init(cursor, _, event)
    return cursor
  },
}
