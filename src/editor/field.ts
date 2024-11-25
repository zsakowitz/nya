import { Block, Cursor, R, Selection, type Init, type InitRet } from "./model"

export class Exts {
  private readonly cmds: { [x: string]: Init } = Object.create(null)
  private default?: Init

  set(name: string, cmd: Init) {
    this.cmds[name] = cmd
    return this
  }

  setAll(names: string[], cmd: Init) {
    for (const name of names) {
      this.cmds[name] = cmd
    }
    return this
  }

  setDefault(cmd: Init) {
    this.default = cmd
    return this
  }

  of(text: string) {
    return this.cmds[text] || this.default
  }
}

export class Field {
  readonly el
  readonly block = new Block(null)
  sel: Selection = new Selection(this.block, null, null, R)

  constructor(readonly exts: Exts) {
    this.el = this.block.el
    this.el.className =
      "cursor-text whitespace-nowrap font-['Symbola','Times',sans-serif] text-[1.265em] font-normal not-italic transition [line-height:1] focus:outline-none [&_*]:cursor-text block"
  }

  init(init: Init, input: string, event?: KeyboardEvent) {
    let ret: InitRet

    if (this.sel.isCursor()) {
      const cursor = this.sel.cursor(R)
      ret = init.init(cursor, input, event) || cursor
    } else if (init.initOn) {
      ret = init.initOn(this.sel, input, event) || this.sel
    } else {
      const cursor = this.sel.remove()
      ret = init.init(cursor, input, event) || cursor
    }

    if (ret) {
      if (ret instanceof Cursor) {
        this.sel = ret.selection()
      } else {
        this.sel = ret
      }
    }
  }

  type(input: string, event?: KeyboardEvent) {
    const ext = this.exts.of(input)
    if (ext) {
      this.init(ext, input, event)
    }
  }
}
