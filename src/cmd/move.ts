import { L, R, type Init } from "../model"

export const CmdMoveLeft: Init = {
  init(cursor) {
    if (cursor[L]) {
      cursor[L].moveInto(cursor, L)
    } else if (cursor.parent?.parent) {
      cursor.parent.parent.moveOutOf(cursor, L, cursor.parent)
    }
  },
}

export const CmdMoveRight: Init = {
  init(cursor) {
    if (cursor[R]) {
      cursor[R].moveInto(cursor, R)
    } else if (cursor.parent?.parent) {
      cursor.parent.parent.moveOutOf(cursor, R, cursor.parent)
    }
  },
}
