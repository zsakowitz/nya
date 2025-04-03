import type { Scope } from "@/sheet/deps"
import { twMerge } from "tailwind-merge"
import { LatexParser } from "./latex"
import {
  Block,
  L,
  performInit,
  R,
  Selection,
  type Dir,
  type Init,
  type VDir,
} from "./model"
import type { Options } from "./options"

/** Props passed to `Display.init()` and `Display.type()`. */
interface FieldInitProps {
  event?: KeyboardEvent
  skipChangeHandlers?: boolean
}

/** A math field which registers no event listeners and is effectively inert. */
export class FieldInert {
  readonly el
  readonly block = new Block(null)
  sel: Selection = new Selection(this.block, null, null, R)

  constructor(
    readonly options: Options,
    readonly scope: Scope,
    className?: string,
  ) {
    this.el = this.block.el
    this.el.className = twMerge(
      "nya-display cursor-text whitespace-nowrap font-['Symbola','Times_New_Roman',serif] text-[1.265em] font-normal not-italic [line-height:1] cursor-text block select-none inline-block",
      className,
    )
  }

  setPrefix(block: Block | ((field: FieldInert) => void)) {
    if (typeof block == "function") {
      const field = new FieldInert(this.options, this.scope)
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
      scope: this.scope,
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
    const ext = this.options.inits?.get(input)
    if (ext && this.init(ext, input, props) !== "browser") {
      return
    }

    if (!input.startsWith("\\")) {
      return
    }
    this.typeLatex(input, props?.skipChangeHandlers)
  }

  typeLatex(source: string, skipChangeHandlers?: boolean) {
    if (!skipChangeHandlers) {
      this.onBeforeChange?.()
    }
    const block = new LatexParser(
      this.options,
      this.scope,
      source,
      this,
    ).parse()
    const cursor = this.sel.remove()
    cursor.insert(block, L)
    this.sel = cursor.selection()
    if (!skipChangeHandlers) {
      this.onAfterChange?.(false)
    }
  }

  latex(source: { raw: readonly string[] }, ...interps: string[]) {
    this.typeLatex(String.raw(source, ...interps))
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
