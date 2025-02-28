import type { VDir } from "../field/model"
import { h, t } from "../jsx"
import type { ItemFactory } from "./item"
import type { Sheet } from "./ui/sheet"

export interface ItemCreateProps {
  at?: number
  focus?: boolean
}

export class ItemList {
  readonly el = h("contents")
  readonly items: ItemRef<unknown>[] = []
  readonly nextIndex = t("1")

  constructor(readonly sheet: Sheet) {}

  private checkIndices() {
    for (let i = 0; i < this.items.length; i++) {
      const expr = this.items[i]!
      expr.elIndex.textContent = i + 1 + ""
    }
    this.nextIndex.textContent = this.items.length + 1 + ""
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
        expr.factory.draw(expr.data)
      } catch (e) {
        console.warn("[draw]", e)
      }
    }
  }

  create<T>(factory: ItemFactory<T>, props?: ItemCreateProps) {
    const at = props?.at
    const index = t("??")
    const ref = new ItemRef<T>(this, factory, null!, null!, index)
    const data = factory.init(ref)
    const el = factory.el(data)
    const before = (at && this.items[at]?.el) || null
    this.el.insertBefore(el, before)
    ;(ref as ItemRefMut).data = data
    ;(ref as ItemRefMut).el = el
    if (at != null && 0 <= at && at <= this.items.length) {
      this.items.splice(at, 0, ref)
    } else {
      this.items.push(ref)
    }
    this.queueIndices()
    if (props?.focus) {
      // if (before) {
      //   setTimeout(() => before.scrollIntoView({ behavior: "instant" }))
      // }
      setTimeout(() => ref.focus())
    }
    return ref
  }

  createDefault(props?: ItemCreateProps) {
    return this.create(this.sheet.factory.defaultItem, props)
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

  pasteBelow(_rows: string[]) {
    // FIXME:
    // const { exprs } = this.expr.sheet
    // let el = this.expr.el
    //
    // let idx = exprs.indexOf(this.expr) + 1
    // if (!idx) idx = exprs.length
    // for (const latex of rest) {
    //   const expr = Expr.of(this.expr.sheet)
    //   exprs.pop()
    //   exprs.splice(idx, 0, expr)
    //   expr.field.typeLatex(latex)
    //   el.insertAdjacentElement("afterend", expr.el)
    //   el = expr.el
    //   idx++
    // }
    // this.expr.sheet.queueIndices()
  }
}

type ItemRefMut = {
  -readonly [K in keyof ItemRef<any>]: ItemRef<any>[K]
}
