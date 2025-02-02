import {
  Cursor,
  D,
  L,
  R,
  Selection,
  U,
  type Dir,
  type Init,
  type VDir,
} from "../../model"
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
      init(cursor, { event, field }) {
        if (event?.shiftKey) {
          const sel = cursor.selection()
          sel.moveFocusFast(dirSelect)
          return sel
        } else {
          if (!cursor.moveVert(dir)) field.onVertOut?.(dir)
        }
      },
      initOn(selection, { event }) {
        if (event?.shiftKey) {
          selection.moveFocusFast(dirSelect)
        }
      },
    }
  } else {
    return {
      init(cursor, { event, field }) {
        if (event) {
          const action =
            isHomeEnd ? !isMac() && (event.ctrlKey ? "doc" : "line")
            : isMac() ?
              event.metaKey && event.altKey ? null
              : event.metaKey ? "line"
              : event.altKey ? "word"
              : "char"
            : event.ctrlKey ? "word"
            : "char"

          if (!action) {
            return
          }

          if (event.shiftKey) {
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

          switch (action) {
            case "line":
              cursor.moveIn(field.block, dir)
              return
            case "word":
              cursor.moveByWord(dir)
              return
            case "char":
            case "doc":
            // TODO:
          }
        }

        if (!cursor.move(dir)) {
          field.onMoveOut?.(dir)
        }
      },
      initOn(sel, { event }) {
        if (event) {
          const action =
            isHomeEnd ? !isMac() && (event.ctrlKey ? "doc" : "line")
            : isMac() ?
              event.metaKey && event.altKey ? null
              : event.metaKey ? "line"
              : event.altKey ? "word"
              : "char"
            : event.ctrlKey ? "word"
            : "char"

          if (!action) {
            return
          }

          if (event.shiftKey) {
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
  init(cursor, { field }) {
    if (!cursor.delete(L)) field.onDelOut?.(L)
  },
  initOn(selection) {
    selection.remove()
  },
}

export const CmdDel: Init = {
  init(cursor, { field }) {
    if (!cursor.delete(R)) field.onDelOut?.(R)
  },
  initOn(selection) {
    selection.remove()
  },
}

export const CmdTab: Init = {
  init(cursor, { event, field }) {
    const dir = event?.shiftKey ? L : R
    if (!cursor.parent?.parent) {
      return field.onTabOut?.(dir) ? undefined : "browser"
    }
    cursor.parent.parent.tabOutOf(cursor, dir, cursor.parent)
  },
  initOn(sel, props) {
    const dir = props.event?.shiftKey ? L : R
    const cursor = sel.cursor(dir)
    return CmdTab.init(cursor, props) || cursor
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

export const CmdSelectAll: Init = {
  init(_, { field }) {
    return new Selection(field.block, null, null, R, new Cursor(null, null))
  },
  initOn(_, { field }) {
    return new Selection(field.block, null, null, R, new Cursor(null, null))
  },
}

export const CmdCopy: Init = {
  init() {
    // do not adjust clipboard on empty selection
  },
  initOn(selection) {
    navigator.clipboard.writeText(selection.latex())
  },
}

export const CmdCut: Init = {
  init() {
    // do not adjust clipboard on empty selection
  },
  initOn(selection) {
    navigator.clipboard.writeText(selection.latex())
    selection.splice()
  },
}
