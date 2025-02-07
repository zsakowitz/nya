import type { Sheet } from "."
import type { AnyExt, CursorStyle } from "../../ext"
import type { AnyPick } from "../../pick"
import { PICK_POINT } from "../../pick/point"
import type { Expr } from "../expr"
import type { Point, PointerHandlers } from "../paper"

interface DataPick {
  pick: true
  from: AnyPick
  data: {}
  found?: {}
}

interface DataDrag {
  ext: AnyExt & { drag: {} }
  data: {}
  cursor: CursorStyle
}

type DataHover =
  | { pick?: false; expr: Expr; ext: AnyExt & { hover: {} }; data: {} }
  | DataPick

export class Handlers implements PointerHandlers<DataDrag, DataHover> {
  readonly pointers: CursorStyle[] = []

  pick?: { from: AnyPick; data: {}; found?: {} } = {
    from: PICK_POINT,
    data: {},
  }

  constructor(readonly sheet: Sheet) {}

  onDraw() {
    if (this.pick && this.pick.found) {
      this.pick.from.draw(this.pick.data, this.pick.found, this.sheet)
    }
  }

  onDragStart(at: Point): DataDrag | null | undefined {
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
    data.ext.drag.move(data.data, to)
  }

  onDragEnd(at: Point, data: DataDrag): void {
    const idx = this.pointers.lastIndexOf(data.cursor)
    if (idx != -1) this.pointers.splice(idx, 1)
    const cursor = this.pointers[this.pointers.length - 1]
    this.sheet.el.style.cursor = cursor || "auto"

    data.ext.drag.end(data.data, at)
  }

  onHoverStart(at: Point): DataHover | null | undefined {
    if (this.pick) {
      this.pick.found = this.pick.from.find(this.pick.data, at, this.sheet)
      this.sheet.paper.queue()
      return {
        pick: true,
        data: this.pick.data,
        from: this.pick.from,
      }
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
  }

  onHoverMove(to: Point, data: DataHover): boolean {
    if (data.pick) {
      data.found = data.from.find(data.data, to, this.sheet)
      if (this.pick) this.pick = data
      this.sheet.paper.queue()
      return true
    }

    for (const expr of this.sheet.exprs
      .filter(
        (x): x is typeof x & { state: { ok: true; ext: { hover: {} } } } =>
          x.state.ok && !!x.state.ext?.hover,
      )
      .sort((a, b) => b.layer - a.layer)) {
      const hoverData = expr.state.ext.hover.on(expr.state.data, to)
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
    return false
  }

  onHoverEnd(_: Point, data: DataHover): void {
    if (data.pick) {
      data.found = undefined
      if (this.pick) this.pick = data
      this.sheet.paper.queue()
      return
    }

    data.ext.hover.off(data.data)
    this.sheet.el.style.cursor =
      this.pointers[this.pointers.length - 1] || "default"
  }

  onUpgrade(at: Point, data: DataHover): DataDrag | null | undefined {
    if (data.pick) {
      const found = data.from.find(data.data, at, this.sheet)
      data.from.select(data.data, found, this.sheet)
      this.sheet.paper.queue()
      return
    }

    data.ext.hover.off(data.data)
    this.sheet.el.style.cursor =
      this.pointers[this.pointers.length - 1] || "default"
    return this.onDragStart(at)
  }
}
