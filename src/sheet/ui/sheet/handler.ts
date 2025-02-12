import type { Sheet } from "."
import type { AnyExt, Cursor } from "../../ext"
import type { AnyPick, Picker } from "../../pick"
import { PICK_BY_TY, type PropsByTy } from "../../pick/normal"
import type { Expr } from "../expr"
import type { Point, PointerHandlers } from "../paper"

interface PickInactive {
  active?: false
  from: AnyPick
  data: {}
}

interface PickActive {
  active: true
  from: AnyPick
  data: {}
  at: Point | null
  found: {} | null
}

type DataDrag =
  | { pick?: false; ext: AnyExt & { drag: {} }; data: {}; cursor: Cursor }
  | { pick: true }

type DataHover =
  | { pick?: false; expr: Expr; ext: AnyExt & { hover: {} }; data: {} }
  | { pick: true }

export class Handlers implements PointerHandlers<DataDrag, DataHover> {
  readonly pointers: Cursor[] = []

  private pick: PickInactive | PickActive | null = null

  constructor(
    readonly sheet: Sheet,
    readonly keys: Record<string, PropsByTy>,
  ) {
    addEventListener("keydown", (ev) => {
      if (
        ev.metaKey ||
        ev.ctrlKey ||
        ev.altKey ||
        document.activeElement?.classList.contains("nya-display")
      ) {
        return
      }

      const pick = keys[ev.key]
      if (pick) {
        this.setPick(PICK_BY_TY, pick)
      }
    })
  }

  private lastMouse: Point | null = null

  onPickChange?(): void

  getPick() {
    return this.pick
  }

  setPick<T extends {}, U extends {}>(pick: Picker<T, U>, data: T) {
    this.sheet.clearSelect()
    pick.init(data, this.sheet)

    const current = this.getPick()
    let at
    if (current) {
      current.from.cancel(current.data)
      this.sheet.paper.queue()
      at = current.active && current.at
    } else if (this.lastMouse) {
      at = this.lastMouse
    }

    if (at) {
      const found = pick.find(data, at, this.sheet)
      this.pick = { active: true, at, from: pick as any, data, found }
      this.onPickChange?.()
    } else {
      this.pick = { active: false, data, from: pick as any }
      this.onPickChange?.()
    }
    this.sheet.paper.queue()
  }

  unsetPick() {
    this.sheet.clearSelect()

    const current = this.getPick()
    if (current) {
      current.from.cancel(current.data)
      this.sheet.paper.queue()
    }
    this.pick = null
    this.onPickChange?.()
  }

  draw() {
    const current = this.getPick()
    if (current) {
      current.from.draw(
        current.data,
        current.active ? current.found : null,
        this.sheet,
      )
    }
  }

  private checkPick(at: Point) {
    const current = this.getPick()
    if (!current) return false

    const found = current.from.find(current.data, at, this.sheet)
    if (found == null) {
      this.pick = {
        active: false,
        data: current.data,
        from: current.from,
      }
      this.onPickChange?.()
    } else {
      this.pick = { ...current, active: true, at, found }
      this.onPickChange?.()
    }
    this.sheet.paper.queue()
    return true
  }

  onDragStart(at: Point): DataDrag | null | undefined {
    this.lastMouse = null

    const current = this.getPick()
    if (current) {
      const found = current.from.find(current.data, at, this.sheet)
      this.pick = { ...current, active: true, at, found }
      this.onPickChange?.()
      this.sheet.paper.queue()
      return { pick: true }
    }

    for (const expr of this.sheet.exprs
      .filter(
        (x): x is typeof x & { state: { ok: true; ext: { drag: {} } } } =>
          x.state.ok && !!x.state.ext?.drag,
      )
      .sort((a, b) => b.layer - a.layer)) {
      const data = expr.state.ext.drag.start(expr.state.data, at)
      if (data == null) continue

      const cursor = expr.state.ext.drag.cursor(data)
      this.pointers.push(cursor)
      this.sheet.el.style.cursor = cursor

      return { ext: expr.state.ext, data, cursor }
    }

    return
  }

  onDragMove(to: Point, data: DataDrag): void {
    this.lastMouse = null

    if (data.pick) {
      const current = this.getPick()
      if (!current) return
      const found = current.from.find(current.data, to, this.sheet)
      this.pick = { ...current, active: true, at: to, found }
      this.onPickChange?.()
      this.sheet.paper.queue()
      return
    }

    data.ext.drag.move(data.data, to)
  }

  onDragEnd(at: Point, data: DataDrag): void {
    this.lastMouse = null

    if (data.pick) {
      const current = this.getPick()
      if (!current) return

      const found = current.from.find(current.data, at, this.sheet)
      this.pick = null
      this.onPickChange?.()
      if (found == null) {
        current.from.cancel(current.data)
      } else {
        current.from.select(current.data, found, this.sheet)
      }
      this.sheet.paper.queue()
      return
    }

    const idx = this.pointers.lastIndexOf(data.cursor)
    if (idx != -1) this.pointers.splice(idx, 1)
    const cursor = this.pointers[this.pointers.length - 1]
    this.sheet.el.style.cursor = cursor || "auto"

    data.ext.drag.end(data.data, at)
  }

  onHoverStart(at: Point): DataHover | null | undefined {
    this.lastMouse = null

    if (this.checkPick(at)) {
      return { pick: true }
    }

    for (const expr of this.sheet.exprs
      .filter(
        (x): x is typeof x & { state: { ok: true; ext: { hover: {} } } } =>
          x.state.ok && !!x.state.ext?.hover,
      )
      .sort((a, b) => b.layer - a.layer)) {
      const data = expr.state.ext.hover.on(expr.state.data, at)
      if (data == null) continue

      if (this.pointers.length == 0) {
        this.sheet.el.style.cursor = expr.state.ext.hover.cursor(data)
      }

      return { expr, ext: expr.state.ext, data }
    }

    this.lastMouse = at
  }

  onHoverMove(at: Point, data: DataHover): boolean {
    this.lastMouse = null

    if (data.pick || this.pick) {
      return this.checkPick(at)
    }

    for (const expr of this.sheet.exprs
      .filter(
        (x): x is typeof x & { state: { ok: true; ext: { hover: {} } } } =>
          x.state.ok && !!x.state.ext?.hover,
      )
      .sort((a, b) => b.layer - a.layer)) {
      const hoverData = expr.state.ext.hover.on(expr.state.data, at)
      if (hoverData == null) continue

      if (this.pointers.length == 0) {
        this.sheet.el.style.cursor = expr.state.ext.hover.cursor(hoverData)
      }

      if (expr != data.expr) {
        data.ext.hover.off(data.data)
      }

      data.expr = expr
      data.ext = expr.state.ext
      data.data = hoverData
      return true
    }

    data.ext.hover.off(data.data)
    this.sheet.el.style.cursor =
      this.pointers[this.pointers.length - 1] || "default"

    this.lastMouse = at
    return false
  }

  onHoverEnd(_: Point, data: DataHover): void {
    this.lastMouse = null

    const current = this.getPick()
    if (current || data.pick) {
      if (!current) return
      this.pick = {
        active: false,
        data: current.data,
        from: current.from,
      }
      this.onPickChange?.()
      this.sheet.paper.queue()
      return
    }

    data.ext.hover.off(data.data)
    this.sheet.el.style.cursor =
      this.pointers[this.pointers.length - 1] || "default"
  }

  onUpgrade(at: Point, data: DataHover): DataDrag | null | undefined {
    this.lastMouse = null

    const current = this.getPick()
    if (current || data.pick) {
      if (!current) return
      const found = current.from.find(current.data, at, this.sheet)
      if (found == null) {
        this.pick = {
          active: false,
          data: current.data,
          from: current.from,
        }
      } else {
        this.pick = { ...current, active: true, at, found }
      }
      this.onPickChange?.()
      this.sheet.paper.queue()
      return { pick: true }
    }

    data.ext.hover.off(data.data)
    this.sheet.el.style.cursor =
      this.pointers[this.pointers.length - 1] || "default"
    const dragging = this.onDragStart(at)
    if (dragging != null) return dragging

    this.lastMouse = at
  }
}
