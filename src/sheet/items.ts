import { errorText } from "@/error"
import type { GlslResult } from "@/eval/lib/fn"
import { D, L, U, type Dir, type VDir } from "@/field/dir"
import { h, t } from "@/jsx"
import type { Point } from "@/lib/point"
import type { ItemFactory } from "./item"
import type { Hint } from "./ui/cv/item"
import type { ItemWithTarget } from "./ui/cv/move"
import type { Sheet } from "./ui/sheet"

interface ItemCreateProps<U> {
  at?: number
  focus?: boolean
  from?: NoInfer<U>
}

abstract class ItemList {
  abstract readonly root: ItemListGlobal
  abstract readonly sheet: Sheet
  abstract readonly parent: ItemRef<unknown> | undefined
  abstract readonly depth: number

  readonly items: ItemRef<unknown>[] = []

  private setIndicesFrom(index: { i: number }) {
    for (const ref of this.items) {
      ref.elIndex.data = index.i + ""
      index.i++
      if (ref.sublist) {
        ref.sublist.setIndicesFrom(index)
      }
    }
  }

  /** `ref` should already have `data` stored. */
  private createOf<T, U>(ref: ItemRef<T>, props?: ItemCreateProps<U>) {
    const data = ref.data
    const aside = ref.factory.aside?.(data)
    const main = ref.factory.main(data)
    if (aside) {
      ;(ref as ItemRefMut).elGrayBar.appendChild(aside)
    }
    // TODO: delete via backspace on gray bar
    const el = ((ref as ItemRefMut).el = h(
      {
        class:
          "grid sm:border-r border-b relative nya-expr border-[--nya-border]",
        style: `grid-template-columns:2.5rem${" 1rem".repeat(this.depth)} auto;--nya-sidebar:calc(var(--nya-sidebar-raw) - ${this.depth}*1rem)`,
      },
      ref.elGrayBar,
      ...Array.from({ length: this.depth }, () =>
        h("border-r border-[--nya-border] my-1"),
      ),
      main,
      h(
        "hidden absolute -inset-y-px inset-x-0 [:first-child>&]:top-0 border-2 border-[--nya-expr-focus] pointer-events-none [:focus-within>&]:block any-hover:[:active>&]:block",
      ),
    ))

    const at = props?.at

    if (at != null && 0 <= at && at < this.items.length) {
      // Insert before a parent node
      this.root.el.insertBefore(el, this.items[at]!.el)
    } else {
      this.insertAfter(el)
    }

    if (at != null && 0 <= at && at <= this.items.length) {
      this.items.splice(at, 0, ref)
    } else {
      this.items.push(ref)
    }

    this.root.queueIndices()
    if (props?.focus) {
      setTimeout(() => ref.factory.focus(ref.data, null))
    }
  }

  private insertAfter(el: HTMLElement) {
    let list: ItemList = this

    while (true) {
      const last = list.items[list.items.length - 1]

      if (last?.sublist) {
        list = last.sublist
        continue
      }

      if (last) {
        this.root.el.insertBefore(el, last.el.nextSibling)
      } else if (list.parent) {
        this.root.el.insertBefore(el, list.parent.el.nextSibling)
      } else {
        this.root.el.appendChild(el)
      }

      return
    }
  }

  create<T, U>(factory: ItemFactory<T, U>, props?: ItemCreateProps<U>) {
    const elIndex = t("??")
    const ref = new ItemRef<T>(
      this.root,
      this,
      factory,
      null!,
      null!,
      elIndex,
      h(
        {
          class:
            "nya-expr-bar inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border] font-sans text-[--nya-expr-index] text-[65%] leading-none focus:outline-none",
          tabindex: "-1",
        },
        elIndex,
      ),
      !!factory.group,
    )
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
    const index = t("??")
    const ref = new ItemRef(
      this.root,
      this,
      factory,
      null!,
      null!,
      index,
      h(
        {
          class:
            "nya-expr-bar inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border] font-sans text-[--nya-expr-index] text-[65%] leading-none focus:outline-none",
          tabindex: "-1",
        },
        index,
      ),
      !!factory.group,
    )
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

  drawWith(suppressed: ItemRef<unknown> | undefined, min: number, max: number) {
    const list: Record<number, ItemRef<unknown>[]> = Object.create(null)
    const addons: Record<number, (() => void)[]> = Object.create(null)
    this.createDrawList(list, addons, suppressed, min, max)

    const keys = Object.keys(list)
      .concat(Object.keys(addons))
      .filter((x, i, a) => a.indexOf(x) == i)
      .sort((a, b) => +a - +b)

    for (const k of keys) {
      if (!(min <= +k && +k <= max)) continue

      for (const ref of list[+k] || []) {
        const items = ref.factory.plot!.items(ref.data)
        for (let i = 0; i < items.length; i++) {
          try {
            ref.factory.plot!.draw(ref.data, items[i]!, i)
          } catch (e) {
            console.warn("[itemlist.draw]", e)
            ref.factory.error?.(ref.data, errorText(e))
          }
        }
      }

      for (const fn of addons[+k] || []) {
        fn()
      }
    }
  }

  protected createDrawList(
    list: Record<number, ItemRef<unknown>[]>,
    addons: Record<number, (() => void)[]>,
    suppressed: ItemRef<unknown> | undefined,
    min: number,
    max: number,
  ) {
    for (const ref of this.items) {
      if (ref == suppressed) continue

      const order = ref.factory.plot?.order(ref.data)

      if (order != null && min <= order && order <= max) {
        ;(list[order] ??= []).push(ref)
      }

      if (ref.sublist) {
        ref.sublist.createDrawList(list, addons, suppressed, min, max)
      }
    }
  }

  glslWith(list: GlslResult[]) {
    for (const ref of this.items) {
      const result = ref.factory.glsl?.(ref.data)

      if (result) {
        list.push(result)
      }
    }
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

  find(items: Record<number, ItemWithTarget[]>, at: Point, hint: Hint) {
    // Reverse order is used here since later items come later in draw order and
    // therefore earlier in interaction order.

    for (let i = this.items.length - 1; i >= 0; i--) {
      // Exit early if we've found enough solutions; caller is responsible for
      // providing better hints if they don't like our results.
      if ((items[hint.maxOrder]?.length ?? 0) >= hint.limit) {
        return
      }

      const {
        factory: { plot },
        data,
        sublist,
      } = this.items[i]!

      const order = plot?.order(data)

      sublist?.find(items, at, hint)

      if (order != null && plot?.target) {
        const plotItems = plot.items(data)
        for (let i = plotItems.length - 1; i >= 0; i--) {
          const item = plotItems[i]!
          if (plot.target.hits({ data, index: i, item }, at, hint)) {
            ;(items[order] ??= []).push({
              target: plot.target,
              data,
              item,
              index: i,
            })
          }
        }
      }
    }
  }
}

export class ItemListGlobal extends ItemList {
  readonly el = h("contents")
  readonly items: ItemRef<unknown>[] = []
  readonly nextIndex = t("1")

  constructor(readonly sheet: Sheet) {
    super()
  }

  get root() {
    return this
  }

  get parent(): undefined {
    return
  }

  get depth() {
    return 0
  }

  private checkIndices() {
    const i = { i: 1 }
    ;(this as any).setIndicesFrom(i)
    this.nextIndex.data = i.i + ""
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

  protected createDrawList(
    list: Record<number, ItemRef<unknown>[]>,
    addons: Record<number, (() => void)[]>,
    suppressed: ItemRef<unknown> | undefined,
    min: number,
    max: number,
  ): void {
    super.createDrawList(list, addons, suppressed, min, max)
    this.sheet.pick.draw(addons)
  }

  draw(min: number, max: number) {
    this.sheet.pick.checkSuppressed()
    const s = this.sheet.pick.suppressed
    this.drawWith(s, min, max)
  }

  glsl() {
    const list: GlslResult[] = []
    this.glslWith(list)
    return list
  }
}

class ItemListLocal<T> extends ItemList {
  constructor(readonly parent: ItemRef<T>) {
    super()
  }

  get depth() {
    return this.parent.list.depth + 1
  }

  get root() {
    return this.parent.root
  }

  get sheet() {
    return this.root.sheet
  }
}

export class ItemRef<T> {
  readonly sublist: ItemListLocal<T> | null

  constructor(
    readonly root: ItemListGlobal,
    readonly list: ItemList,
    readonly factory: ItemFactory<T>,
    readonly data: T,
    readonly el: HTMLElement,
    readonly elIndex: Text,
    readonly elGrayBar: HTMLElement,
    sublist: boolean,
  ) {
    this.sublist = sublist ? new ItemListLocal(this) : null
  }

  delete() {
    if (this.sublist) {
      while (this.sublist.items[0]) {
        this.sublist.items[0].delete()
      }
    }

    const idx = this.list.items.indexOf(this)
    if (idx == -1) return

    this.el.remove()
    this.list.items.splice(idx, 1)
    try {
      this.factory.unlink(this.data)
    } catch (e) {
      console.warn("[expr.destroy]", e)
    }

    this.root.sheet.queueGlsl()
    this.root.queueIndices()
    this.root.sheet.cv.queue()
  }

  index() {
    return this.list.items.indexOf(this)
  }

  offset(by: VDir) {
    switch (by) {
      case U:
        // If I am the first item, move into my parent
        if (this.index() == 0) {
          return this.list.parent
        }

        let prev: ItemRef<unknown> = this.list.items[this.index() - 1]!

        // Move into the last item of `prev`:
        // 1. If `prev` has no sublist, move into `prev`
        // 2a. If `prev` has a sublist, move into `prev.sublist.at(-1)`
        // 2b. If `prev.sublist.at(-1)` does not exist, move into `prev`
        while (true) {
          if (!prev.sublist) {
            return prev
          }
          const last: ItemRef<unknown> | undefined =
            prev.sublist.items[prev.sublist.items.length - 1]
          if (!last) {
            return prev
          }
          prev = last
        }

      case D:
        // If I have a sublist, move into it
        if (this.sublist?.items[0]) {
          return this.sublist.items[0]
        }

        let el: ItemRef<unknown> | undefined = this
        while (el) {
          const idx = el.index()
          if (el.list.items[idx + 1]) {
            return el.list.items[idx + 1]
          }

          el = el.list.parent
        }
    }
  }

  focus(from: VDir) {
    this.factory.focus(this.data, from)
  }

  focusAside() {
    this.elGrayBar.focus()
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

  onDelOut(towards: Dir, allowDeletion: boolean) {
    // TODO: allow deleting containing folder
    // if (
    //   towards == L &&
    //   this.list != this.root &&
    //   this.index() == this.list.items.length - 1
    // ) {
    //   return
    // }

    if (!allowDeletion) {
      return
    }

    const idx = this.index()
    if (idx == -1) return

    this.delete()

    const nextIndex = towards == L ? Math.max(0, idx - 1) : idx
    const next = this.root.items[nextIndex]

    if (next) {
      next.focus(towards == L ? D : U)
    } else if (towards == L) {
      this.root.createDefault({ focus: true })
    } else {
      const prev = this.root.items[idx - 1]
      if (prev) {
        prev.focus(D)
      } else {
        this.root.createDefault({ focus: true })
      }
    }
  }

  onVertOut(towards: VDir) {
    const ref = this.offset(towards)

    if (ref) {
      ref.focus(towards == U ? D : U)
    } else if (towards == D) {
      this.root.createDefault({ focus: true })
    }
  }

  onEnter(_towards: typeof D) {
    if (this.sublist) {
      this.sublist.createDefault({ at: 0, focus: true })
      return
    }

    this.list.createDefault({ at: this.index() + 1, focus: true })
  }
}

type ItemRefMut = {
  -readonly [K in keyof ItemRef<unknown>]: ItemRef<unknown>[K]
}
