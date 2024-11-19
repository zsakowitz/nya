import { U_ZERO_WIDTH_SPACE, h, t } from "./jsx"

export const LEFT = -1
export const RIGHT = 1
export type Dir = -1 | 1

export function flipDir(dir: Dir): Dir
export function flipDir(dir: Dir | null): Dir | null
export function flipDir(dir: Dir | null): Dir | null {
  switch (dir) {
    case 1:
      return -1
    case -1:
      return 1
    case null:
      return null
  }
}

/** A node is either a block or a child node. */
export abstract class Node {
  abstract readonly parent: Node | null
  abstract readonly [LEFT]: Node | null
  abstract readonly [RIGHT]: Node | null
  abstract readonly el: HTMLSpanElement
  abstract intoScreenReadable(): string
  abstract intoAsciiMath(): string
  abstract intoLatex(): string
}

interface BlockMut extends Block {
  [LEFT]: Block | null
  [RIGHT]: Block | null
  parent: Command | null
}

/** A block is like an expression. It contains commands. */
export class Block extends Node {
  readonly children: Command[] = []
  readonly [LEFT]: Block | null
  readonly [RIGHT]: Block | null = null
  readonly el = h(
    "span",
    "inline-block align-middle",
    // h(
    //   "span",
    //   "inline-block before:content-['c'] before:font-['Times'] before:[line-height:.9] before:italic",
    // ),
  )

  constructor(readonly parent: Command | null) {
    super()

    if (parent) {
      this[LEFT] = parent.blocks[parent.blocks.length - 1] ?? null
      parent.blocks.push(this)
    } else {
      this[LEFT] = null
    }
  }

  intoAsciiMath(): string {
    return this.children.map((x) => x.intoAsciiMath()).join("")
  }

  intoLatex(): string {
    return this.children.map((x) => x.intoAsciiMath()).join("")
  }

  intoScreenReadable(): string {
    return this.children.map((x) => x.intoScreenReadable()).join("")
  }
}

interface CursorMut extends Cursor {
  [RIGHT]: Command | null
  parent: Block | null
}

/** A cursor belongs inside some block. */
export class Cursor {
  get [LEFT](): Command | null {
    return this[RIGHT]?.[LEFT] ?? null
  }

  readonly [RIGHT]: Command | null

  readonly el = h(
    "span",
    "z-[1] border-l -ml-px relative inline-block border-current",
    t(U_ZERO_WIDTH_SPACE),
  )

  constructor(
    readonly parent: Block | null,
    before: Command | null,
  ) {
    this[RIGHT] = before
  }

  unrender() {
    this.el.remove()
  }

  render() {
    this.parent?.el.insertBefore(this.el, this[RIGHT]?.el ?? null)
  }

  placeNextTo(el: Command, side: Dir) {
    ;(this as CursorMut).parent = el.parent
    ;(this as CursorMut)[RIGHT] = side == LEFT ? el : el[RIGHT]
  }

  placeInsideOf(el: Block, side: Dir) {
    ;(this as CursorMut).parent = el
    ;(this as CursorMut)[RIGHT] = (side == LEFT && el.children[0]) || null
  }

  clone() {
    return new Cursor(this.parent, this[RIGHT])
  }
}

interface CommandMut extends Command {
  [LEFT]: Command | null
  [RIGHT]: Command | null
  parent: Block | null
}

/** A command is a single item inside a block. */
export abstract class Command extends Node {
  readonly [LEFT]: Command | null = null
  readonly [RIGHT]: Command | null = null
  readonly parent: Block | null = null

  constructor(
    readonly ctrlSeq: string,
    readonly el: HTMLSpanElement,
    readonly blocks: Block[],
  ) {
    super()
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]! as BlockMut
      block.parent = this
      block[LEFT] = blocks[i - 1] ?? null
      block[RIGHT] = blocks[i + 1] ?? null
    }
  }

  insertAt(cursor: Cursor, dir: Dir) {
    ;(this as CommandMut).parent = cursor.parent
    ;(this as CommandMut)[LEFT] = cursor[LEFT]
    ;(this as CommandMut)[RIGHT] = cursor[RIGHT]
    if (dir == RIGHT) {
      ;(cursor as CursorMut)[RIGHT] = this
    }
    this.parent?.el.insertBefore(this.el, this[RIGHT]?.el ?? null)
  }
}

export interface CommandConstructor {
  createLeftOf(cursor: Cursor, input: string): void
}

export class Exts {
  private readonly cmds = new Map<string, CommandConstructor>()
  private default?: CommandConstructor

  set<T extends CommandConstructor>(name: string, cmd: T) {
    this.cmds.set(name, cmd)
    return this
  }

  setDefault(cmd: CommandConstructor) {
    this.default = cmd
    return this
  }

  of(text: string) {
    return this.cmds.get(text) ?? this.default
  }
}

export class Field {
  readonly el
  readonly block = new Block(null)
  readonly cursor = new Cursor(null, null)

  constructor(readonly exts: Exts) {
    this.el = this.block.el
    this.el.classList.add(
      "whitespace-nowrap",
      "font-['Times','Symbola',sans-serif]",
    )
  }

  type(input: string) {
    this.exts.of(input)?.createLeftOf(this.cursor, input)
  }
}
