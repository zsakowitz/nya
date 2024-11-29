import { D, L, R, U, type Dir, type Init, type VDir } from "../../model"
import { isMac } from "../../shortcut"

/**
 * Cross-platform text editing shortcuts ("Left" is substitute for appropriate
 * arrow key)
 *
 * MacOS:
 *
 * - Cursor moves one word: Alt+Left
 * - Cursor moves one line: Meta+Left
 * - Extend selection to word: Shift+Alt+Left
 * - Extend selection to line: Shift+Meta+Left
 *
 * Everyone else:
 *
 * - Cursor moves one word: Ctrl+Left
 * - Cursor moves one line: Home/End
 * - Extend selection to word: Shift+Ctrl+Left
 * - Extend selection to line: Shift+(Home/End)
 */
void 0 // stops jsdoc from doc'ing

export function CmdMove(dir: Dir | VDir, isHomeEnd = false): Init {
  if (dir == U || dir == D) {
    const dirSelect = dir == U ? L : R
    return {
      init(cursor, _, _0, ev) {
        if (ev?.shiftKey) {
          const sel = cursor.selection()
          sel.moveFocusFast(dirSelect)
          return sel
        } else {
          cursor.moveVert(dir)
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
          const action =
            isHomeEnd ? !isMac() && (ev.ctrlKey ? "doc" : "line")
            : isMac() ?
              ev.metaKey && ev.altKey ? null
              : ev.metaKey ? "line"
              : ev.altKey ? "word"
              : "char"
            : ev.ctrlKey ? "word"
            : "char"

          if (!action) {
            return
          }

          if (ev.shiftKey) {
            const sel = cursor.selection()
            switch (action) {
              case "line":
                sel.moveFocusToEnd(dir)
                break
              case "word":
                sel.moveFocusByWord(dir)
                break
              case "char":
                sel.moveFocus(dir)
                break
              case "doc":
              // TODO:
            }
            return sel
          }

          if (ev.altKey) {
            cursor.moveByWord(dir)
            return cursor
          }
        }

        cursor.move(dir)
      },
      initOn(sel, _, _0, ev) {
        if (ev) {
          const action =
            isHomeEnd ? !isMac() && (ev.ctrlKey ? "doc" : "line")
            : isMac() ?
              ev.metaKey && ev.altKey ? null
              : ev.metaKey ? "line"
              : ev.altKey ? "word"
              : "char"
            : ev.ctrlKey ? "word"
            : "char"

          if (!action) {
            return
          }

          if (ev.shiftKey) {
            switch (action) {
              case "line":
                sel.moveFocusToEnd(dir)
                break
              case "word":
                sel.moveFocusByWord(dir)
                break
              case "char":
                sel.moveFocus(dir)
                break
              case "doc":
              // TODO:
            }
            return
          }
        }

        return sel.cursor(dir)
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

export const CmdBreakCol: Init = {
  init(cursor) {
    let el = cursor.clone()
    while (el.parent && el.parent.parent) {
      if (el.parent.parent.insCol) {
        el.parent.parent.insCol(el, el.parent, el[L] || !el[R] ? R : L)
        return el
      }

      el.moveTo(el.parent.parent, R)
    }
  },
}

export const CmdBreakRow: Init = {
  init(cursor) {
    let el = cursor.clone()
    while (el.parent && el.parent.parent) {
      if (el.parent.parent.insRow) {
        el.parent.parent.insRow(el, el.parent, null)
        return el
      }

      el.moveTo(el.parent.parent, R)
    }
  },
}
