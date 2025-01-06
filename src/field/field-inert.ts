import {
  Block,
  performInit,
  R,
  Selection,
  type Dir,
  type Init,
  type VDir,
} from "./model"
import type { Exts, Options } from "./options"

/** Props passed to `Display.init()` and `Display.type()`. */
export interface FieldInitProps {
  event?: KeyboardEvent
  skipChangeHandlers?: boolean
}

/** A math field which registers no event listeners and is effectively inert. */
export class FieldInert {
  readonly el
  readonly block = new Block(null)
  sel: Selection = new Selection(this.block, null, null, R)

  constructor(
    readonly exts: Exts,
    readonly options: Options,
  ) {
    this.el = this.block.el
    this.el.className =
      "nya-display cursor-text whitespace-nowrap font-['Symbola','Times',sans-serif] text-[1.265em] font-normal not-italic transition [line-height:1] cursor-text block select-none inline-block"
  }

  setPrefix(block: Block | ((field: FieldInert) => void)) {
    if (typeof block == "function") {
      const field = new FieldInert(this.exts, this.options)
      block(field)
      block = field.block
    }
    while (block.el.children[0]) {
      const node = block.el.children[block.el.children.length - 1]!
      node.classList.add("nya-prefix")
      this.el.insertBefore(node, this.el.firstChild)
    }
  }

  init(init: Init, input: string, props?: FieldInitProps): "browser" | null {
    if (!props?.skipChangeHandlers) {
      this.onBeforeChange?.()
    }

    const value = performInit(init, this.sel, {
      input,
      event: props?.event,
      field: this,
      options: this.options,
    })
    if (value != "browser") {
      this.sel = value
    }

    if (!props?.skipChangeHandlers) {
      this.onAfterChange?.(value == "browser")
    }

    return value == "browser" ? value : null
  }

  type(input: string, props?: FieldInitProps) {
    const ext = this.exts.of(input)
    if (ext) {
      this.init(ext, input, props)
    }
  }

  typeEach(source: string) {
    this.onBeforeChange?.()
    this.sel = new Selection(this.block, null, null, R)
    this.sel.remove()
    source
      .split(" ")
      .forEach((input) => this.type(input, { skipChangeHandlers: true }))
    this.onAfterChange?.(false)
  }

  // Fired around `.init()` calls
  onBeforeChange?(): void
  onAfterChange?(wasChangeCanceled: boolean): void

  // Fired when arrows navigate outside of the field
  onMoveOut?(towards: Dir): void
  onVertOut?(towards: VDir): void
  onDelOut?(towards: Dir): void

  /** Return `true` to override the browser's default behavior. */
  onTabOut?(towards: Dir): boolean
}
