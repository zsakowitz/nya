import type { ItemRef } from "../../items"
import type { Sheet } from "../sheet"
import type { Hint } from "./item"
import type { Handler, ItemWithTarget, PointerHandlerRet } from "./move"

// SHAPE: consistent shape
export interface Picker<T extends {}> {
  id(data: T): number
  toggle(data: T, on: boolean): void
  hint(data: T): Hint | null
  draw(
    record: Record<number, (() => void)[]>,
    data: T,
    item: ItemWithTarget | null,
    sheet: Sheet,
  ): void
  /** `item=null` means it was a cancelled action. */
  take(data: T, item: ItemWithTarget | null, sheet: Sheet): T | null
  /** Suppresses the rendering of a particular item. */
  suppress(data: T, item: ItemWithTarget | null): ItemRef<unknown> | null
}

export class PickHandler2 {
  readonly onChange: (() => void)[] = []

  private picker: Picker<{}> | undefined
  private d: {} | undefined

  get data() {
    return this.picker && this.d
  }

  constructor(
    private readonly sheet: Sheet,
    private readonly handler: PointerHandlerRet,
    readonly base: Handler,
  ) {
    handler.oc = () => {
      this.onChange.forEach((x) => x())
    }

    base.take = (item) => {
      if (!this.picker) return

      const next = this.picker.take(this.data!, item, sheet)
      if (!next) {
        this.cancel(true)
      } else {
        this.set(this.picker, next)
      }
    }
  }

  get id(): number | null {
    if (this.picker) {
      return this.picker.id(this.d!)
    } else {
      return null
    }
  }

  cancel(force?: boolean): void {
    if (this.picker) {
      const next = this.picker.take(this.d!, null, this.sheet)
      this.picker.toggle(this.data!, false)

      if (!force && next) {
        this.d = next
        this.handler.picking = this.picker.hint(next) ?? undefined
        this.picker.toggle(this.data!, true)
        return
      }
    }

    this.handler.picking = undefined
    this.picker = undefined
    this.d = undefined
  }

  suppressed: ItemRef<unknown> | undefined

  checkSuppressed(): void {
    this.suppressed =
      this.picker?.suppress(this.d!, this.handler.picked ?? null) ?? undefined
  }

  isActive(): boolean {
    return !!this.picker
  }

  draw(record: Record<number, (() => void)[]>): void {
    this.picker?.draw(
      record,
      this.data!,
      this.handler.picked ?? null,
      this.sheet,
    )
  }

  set<T extends {}>(picker: Picker<T>, data: T): void {
    this.cancel(true)
    this.picker = picker
    this.d = data
    this.handler.picking = picker.hint(data) ?? undefined
    picker.toggle(data, true)
  }
}
