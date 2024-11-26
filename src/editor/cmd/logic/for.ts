import { h } from "../../jsx"
import { Block, Command, Cursor, L, type Dir } from "../../model"

export class CmdFor extends Command<
  [bound: Block, source: Block, mapped: Block]
> {
  static init(cursor: Cursor) {
    const b1 = new Block(null)
    new CmdFor(b1, new Block(null), new Block(null)).insertAt(cursor, L)
    cursor.moveIn(b1, L)
  }

  constructor(mapped: Block, bound: Block, source: Block) {
    super(
      "\\matrix",
      h(
        "relative inline-block align-baseline",
        h(
          "left-[.15em] absolute top-0 bottom-[2px] inline-block w-[.25em] border-l border-y border-current",
        ),
        h(
          "my-[.1em] mx-[.55em] gap-y-[.1em] flex flex-col items-baseline",
          h("", mapped.el),
          h(
            "text-[60%]",
            h("font-serif", "for "),
            bound.el,
            h("font-serif", " in "),
            source.el,
          ),
        ),
        h(
          "right-[.15em] absolute top-0 bottom-[2px] inline-block w-[.25em] border-r border-y border-current",
        ),
      ),
      [mapped, bound, source],
    )
  }

  latex(): string {
    return "TODO:"
  }

  moveOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    const next = this.blocks[this.blocks.indexOf(block) + towards]
    if (next) {
      cursor.moveIn(next, L)
    }
  }
}
