import { Block, Cursor } from "./model"

export interface CommandConstructor {
  createLeftOf(cursor: Cursor, input: string): void
}

export class Exts {
  private readonly cmds: { [x: string]: CommandConstructor } =
    Object.create(null)
  private default?: CommandConstructor

  set<T extends CommandConstructor>(name: string, cmd: T) {
    this.cmds[name] = cmd
    return this
  }

  setDefault(cmd: CommandConstructor) {
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
    this.el.classList.add("whitespace-nowrap", "font-['Symbola','Times',serif]")
  }

  type(input: string) {
    this.exts.of(input)?.createLeftOf(this.cursor, input)
  }
}
