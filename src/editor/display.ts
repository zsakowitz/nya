import { Block, performInit, R, Selection, type Init } from "./model"
import type { Options } from "./options"

export class Exts {
  private readonly cmds: { [x: string]: Init } = Object.create(null)
  private default?: Init

  getAll(): string[] {
    return Object.getOwnPropertyNames(this.cmds)
  }

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

export class Display {
  readonly el
  readonly block = new Block(null)
  sel: Selection = new Selection(this.block, null, null, R)

  constructor(
    readonly exts: Exts,
    readonly options: Options = {},
  ) {
    this.el = this.block.el
    this.el.className =
      "cursor-text whitespace-nowrap font-['Symbola','Times',sans-serif] text-[1.265em] font-normal not-italic transition [line-height:1] focus:outline-none [&_*]:cursor-text block select-none"
  }

  init(init: Init, input: string, event?: KeyboardEvent) {
    this.sel = performInit(init, this.sel, input, this.options, event)
  }

  type(input: string, event?: KeyboardEvent) {
    const ext = this.exts.of(input)
    if (ext) {
      this.init(ext, input, event)
    }
  }
}
