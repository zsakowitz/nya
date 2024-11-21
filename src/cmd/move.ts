import { D, U, type Dir, type Init, type VDir } from "../model"

export function CmdMove(dir: Dir | VDir): Init {
  if (dir == U || dir == D) {
    return {
      init(cursor) {
        cursor.moveVert(dir)
      },
    }
  } else {
    return {
      init(cursor) {
        cursor.move(dir)
      },
      initOn(selection) {
        return selection.cursor(dir)
      },
    }
  }
}
