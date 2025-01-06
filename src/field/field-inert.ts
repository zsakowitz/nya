import { Block, performInit, R, Selection, type Init } from "./model"
import type { Exts, Options } from "./options"

/** Props passed to `Display.init()` and `Display.type()`. */
export interface FieldInitProps {
  event?: KeyboardEvent
  skipChangeHandlers?: boolean
}

/** A math field which registers no event listeners and is effectively inert. */
export class FieldInert {
  readonly contents
  readonly block = new Block(null)
  sel: Selection = new Selection(this.block, null, null, R)

  constructor(
    readonly exts: Exts,
    readonly options: Options,
  ) {
    this.contents = this.block.el
    this.contents.className =
      "nya-display cursor-text whitespace-nowrap font-['Symbola','Times',sans-serif] text-[1.265em] font-normal not-italic transition [line-height:1] focus:outline-none [&_*]:cursor-text block select-none"
  }

  init(init: Init, input: string, props?: FieldInitProps) {
    if (!props?.skipChangeHandlers) {
      this.beforeChange?.()
    }

    this.sel = performInit(init, this.sel, {
      input,
      event: props?.event,
      field: this,
      options: this.options,
    })

    if (!props?.skipChangeHandlers) {
      this.afterChange?.()
    }
  }

  type(input: string, props?: FieldInitProps) {
    const ext = this.exts.of(input)
    if (ext) {
      this.init(ext, input, props)
    }
  }

  beforeChange?(): void
  afterChange?(): void
}
