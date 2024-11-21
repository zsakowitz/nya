import { Block, Cursor, type Init } from "./model"

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
  readonly cursor = new Cursor(null, null)

  constructor(readonly exts: Exts) {
    this.el = this.block.el
    this.el.className =
      "cursor-text whitespace-nowrap font-['Symbola','Times',sans-serif] text-[1.265em] font-normal not-italic text-black transition [line-height:1] focus:outline-none dark:text-white [&_*]:cursor-text block"
  }

  type(input: string) {
    this.exts.of(input)?.init(this.cursor, input)
  }
}
