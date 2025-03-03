import type { VDir } from "../field/model"
import { h, t } from "../jsx"
import type { ItemFactory } from "./item"
import type { Sheet } from "./ui/sheet"

export interface ItemCreateProps<U> {
  at?: number
  focus?: boolean
  from?: NoInfer<U>
}

export class ItemList {
  readonly el = h("contents")
  readonly items: ItemRef<unknown>[] = []
  readonly nextIndex = t("1")

  constructor(readonly sheet: Sheet) {}

  private checkIndices() {
    let index = 1
    for (const expr of this.items) {
      const size = expr.factory.size?.(expr.data) ?? 1
      expr.elIndex.textContent = "" + index
      index += size
    }
    this.nextIndex.textContent = "" + index
  }

  private _qdIndices = false
  queueIndices() {
    if (this._qdIndices) return
    queueMicrotask(() => {
      this._qdIndices = false
      this.checkIndices()
    })
    this._qdIndices = true
  }

  draw() {
    for (const expr of this.items) {
      try {
        expr.factory.draw?.(expr.data)
      } catch (e) {
        console.warn("[draw]", e)
      }
    }
  }

  /** `ref` should already have `data` stored. */
  private createOf<T, U>(ref: ItemRef<T>, props?: ItemCreateProps<U>) {
    const data = ref.data
    const el = ref.factory.el(data)
    ;(ref as ItemRefMut).el = el

    const at = props?.at
    const before = (at && this.items[at]?.el) || null
    this.el.insertBefore(el, before)
    if (at != null && 0 <= at && at <= this.items.length) {
      this.items.splice(at, 0, ref)
    } else {
      this.items.push(ref)
    }

    this.queueIndices()
    if (props?.focus) {
      setTimeout(() => ref.focus())
    }
  }

  create<T, U>(factory: ItemFactory<T, U>, props?: ItemCreateProps<U>) {
    const ref = new ItemRef<T>(this, factory, null!, null!, t("??"))
    ;(ref as ItemRefMut).data = factory.init(ref, undefined, props?.from)
    this.createOf(ref, props)
    return ref
  }

  createDefault(props?: ItemCreateProps<undefined>) {
    return this.create(this.sheet.factory.defaultItem, props)
  }

  private fromStringByFactory<T, U>(
    factory: ItemFactory<T, U>,
    source: string,
    props?: ItemCreateProps<U>,
  ) {
    const elIndex = t("??")
    const ref = new ItemRef(this, factory, null!, null!, elIndex)
    const data = factory.init(ref, source, props?.from)
    ;(ref as ItemRefMut).data = data
    this.createOf(ref, props)
    return ref
  }

  private fromStringDefault(
    source: string,
    props?: ItemCreateProps<undefined>,
  ) {
    return this.fromStringByFactory<unknown, undefined>(
      this.sheet.factory.defaultItem,
      source,
      props,
    )
  }

  private fromStringById(
    id: string,
    source: string,
    props?: ItemCreateProps<undefined>,
  ) {
    const factory =
      this.sheet.factory.defaultItem.id == id ?
        this.sheet.factory.defaultItem
      : this.sheet.factory.items[id]
    if (!factory) {
      throw new Error(`Item type '${id}' is not defined.`)
    }
    return this.fromStringByFactory(factory, source, props)
  }

  fromString(source: string, props?: ItemCreateProps<undefined>) {
    if (source[0] == "#") {
      const next = source.indexOf("#", 1)
      if (next == -1) {
        return this.fromStringDefault(source)
      } else {
        return this.fromStringById(
          source.slice(1, next),
          source.slice(next + 1),
          props,
        )
      }
    } else {
      return this.fromStringDefault(source)
    }
  }
}

export class ItemRef<T> {
  constructor(
    readonly list: ItemList,
    readonly factory: ItemFactory<T>,
    readonly data: T,
    readonly el: HTMLElement,
    readonly elIndex: Text,
  ) {}

  delete() {
    const idx = this.list.items.indexOf(this)
    if (idx == -1) return

    this.el.remove()
    this.list.items.splice(idx, 1)
    try {
      this.factory.unlink(this.data)
    } catch (e) {
      console.warn("[expr.destroy]", e)
    }

    this.list.sheet.queueGlsl()
    this.list.queueIndices()
    this.list.sheet.paper.queue()
  }

  index() {
    return this.list.items.indexOf(this)
  }

  offset(by: number) {
    return this.list.items[this.index() + by]
  }

  focus(from?: VDir) {
    this.factory.focus(this.data, from)
  }

  pasteBelow(rest: string[]) {
    let idx = this.index() + 1 || this.list.items.length

    for (const source of rest) {
      try {
        this.list.fromString(source, { at: idx })
      } catch (e) {
        console.warn("[pasteBelow]", e)
      }
    }
  }
}

type ItemRefMut = {
  -readonly [K in keyof ItemRef<unknown>]: ItemRef<unknown>[K]
}
