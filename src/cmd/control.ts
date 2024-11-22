import { D, L, R, U, type Dir, type Init, type VDir } from "../model"

export type InitControl = Init<{ shiftKey: boolean } | undefined>

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

export const CmdDelete: InitControl = {
  init(cursor, _, event) {
    if (event?.shiftKey) {
      cursor.delete(R)
    } else {
      cursor.delete(L)
    }
  },
  initOn(selection) {
    selection.remove()
  },
}
