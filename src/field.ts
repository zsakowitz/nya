import { Block, Cursor, R, Selection, type Init, type InitRet } from "./model"

export class Exts {
  private readonly cmds: { [x: string]: Init } = Object.create(null)
  private default?: Init

  set(name: string, cmd: Init) {
    this.cmds[name] = cmd
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
      "cursor-text whitespace-nowrap font-['Symbola','Times',sans-serif] text-[1.265em] font-normal not-italic text-black transition [line-height:1] focus:outline-none dark:text-white [&_*]:cursor-text block"
  }

  init(init: Init, input: string, event?: KeyboardEvent) {
    let ret: InitRet
    if (this.sel.isCursor()) {
      ret = init.init((ret = this.sel.cursor(R)), input, event) || ret
    } else if (init.initOn) {
      ret = init.initOn(this.sel, input, event)
    } else {
      ret = init.init((ret = this.sel.remove()), input, event) || ret
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
