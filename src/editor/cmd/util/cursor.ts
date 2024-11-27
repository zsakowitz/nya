import { D, L, R, U, type Dir, type Init, type VDir } from "../../model"

export function CmdMove(
  dirMove: Dir | VDir,
  dirSelect: Dir = dirMove == L || dirMove == U ? L : R,
): Init {
  if (dirMove == U || dirMove == D) {
    return {
      init(cursor, _, _0, ev) {
        if (ev?.shiftKey) {
          const sel = cursor.selection()
          sel.moveFocusFast(dirSelect)
          return sel
        } else {
          cursor.moveVert(dirMove)
        }
      },
      initOn(selection, _, _0, event) {
        if (event?.shiftKey) {
          selection.moveFocusFast(dirSelect)
        }
      },
    }
  } else {
    return {
      init(cursor, _, _0, ev) {
        if (ev) {
          if (ev.shiftKey && ev.altKey) {
            const sel = cursor.selection()
            sel.moveFocusByWord(dirSelect)
            return sel
          } else if (ev.shiftKey) {
            const sel = cursor.selection()
            sel.moveFocus(dirSelect)
            return sel
          } else if (ev.altKey) {
            cursor.moveByWord(dirMove)
            return cursor
          }
        }

        cursor.move(dirMove)
      },
      initOn(sel, _, _0, ev) {
        if (ev && ev.shiftKey) {
          if (ev.altKey) {
            sel.moveFocusByWord(dirSelect)
          } else {
            sel.moveFocus(dirSelect)
          }
          return sel
        }

        return sel.cursor(dirMove)
      },
    }
  }
}

export const CmdBackspace: Init = {
  init(cursor) {
    cursor.delete(L)
  },
  initOn(selection) {
    selection.remove()
  },
}

export const CmdDel: Init = {
  init(cursor) {
    cursor.delete(R)
  },
  initOn(selection) {
    selection.remove()
  },
}

export const CmdTab: Init = {
  init(cursor, _, _0, event) {
    const dir = event?.shiftKey ? L : R
    if (!cursor.parent) {
      return
    }
    if (!cursor.parent.parent) {
      return
    }
    cursor.parent.parent.tabOutOf(cursor, dir, cursor.parent)
  },
  initOn(sel, _, _0, event) {
    const dir = event?.shiftKey ? L : R
    const cursor = sel.cursor(dir)
    CmdTab.init(cursor, _, _0, event)
    return cursor
  },
}
