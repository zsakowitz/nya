import type { Node } from "@/eval/ast/token"
import { NO_DRAG } from "@/eval/ast/tx"
import type { LatexParser } from "@/field/latex"
import {
  Block,
  Command,
  Cursor,
  L,
  R,
  type Dir,
  type InitProps,
  type InitRet,
  type Selection,
} from "@/field/model"
import { h } from "@/jsx"
import type { Package } from "@/pkg"

declare module "@/eval/ast/token" {
  interface Nodes {
    "nya:cas:symbolic": { ast: Node; latex: string }
  }
}

export class CmdSymVar extends Command<[Block]> {
  static init(cursor: Cursor, _props: InitProps): InitRet {
    const block = new Block(null)
    new this(block).insertAt(cursor, L)
    return block.cursor(R)
  }

  static initOn(selection: Selection, _props: InitProps): InitRet {
    new this(selection.splice().unwrap()).insertAt(selection.cursor(R), L)
  }

  static fromLatex(_cmd: string, parser: LatexParser): Command {
    return new this(parser.arg())
  }

  constructor(block = new Block(null)) {
    super(
      "\\nyasym",
      h(
        "mx-[.1em] my-[.1em] inline-block rounded border-2 border-blue-500 bg-blue-50 px-[.2em] py-[.1em] text-center text-blue-500 dark:bg-blue-950 [&.nya-selected]:bg-blue-500 [&.nya-selected]:text-blue-50 [.nya-selected_&]:bg-blue-500 [.nya-selected_&]:text-blue-50",
        block.el,
      ),
      [block],
    )
  }

  reader(): string {
    return ` Symbolic ${this.blocks[0].reader()} EndSymbolic `
  }

  ascii(): string {
    return `symbolic(${this.blocks[0].ascii()})`
  }

  latex(): string {
    return `\\nyasym{${this.blocks[0].latex()}}`
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveIn(this.blocks[0], towards == L ? R : L)
  }

  moveOutOf(cursor: Cursor, towards: Dir, _block: Block): void {
    cursor.moveTo(this, towards)
  }

  vertFromSide(): undefined {}

  vertInto(): Block {
    return this.blocks[0]
  }

  vertOutOf(): undefined {}

  delete(cursor: Cursor, from: Dir): void {
    cursor.moveIn(this.blocks[0], from)
  }

  focus(x: number, y: number): Cursor {
    // TODO: if user clicks the borders or padding, cursor should go to the side
    return this.blocks[0].focus(x, y)
  }

  ir(tokens: Node[]): true | void {
    tokens.push({
      type: "nya:cas:symbolic",
      ast: this.blocks[0].ast(),
      latex: this.blocks[0].latex(),
    })
  }
}

export const PKG_CAS: Package = {
  id: "nya:cas",
  name: "symbolic computation",
  label: "computation over symbolic variables",
  field: {
    inits: {
      $: CmdSymVar,
    },
    latex: {
      "\\nyasym": CmdSymVar,
    },
  },
  eval: {
    txrs: {
      "nya:cas:symbolic": {
        deps() {
          // symbolic computations have no dependencies
        },
        js() {
          throw new Error("Symbolic computation is not supported yet.")
        },
        glsl() {
          throw new Error("Symbolic computation is not supported in shaders.")
        },
        drag: NO_DRAG,
      },
    },
  },
}
