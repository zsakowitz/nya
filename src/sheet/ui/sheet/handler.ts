import type { Sheet } from "."
import type { AnyExt, CursorStyle } from "../../ext"
import type { Expr } from "../expr"
import type { Point, PointerHandlers } from "../paper"

interface SheetHandlerData {
  ext: AnyExt & { drag: {} }
  data: {}
  cursor: CursorStyle
}

interface SheetHoverData {
  expr: Expr
  ext: AnyExt & { hover: {} }
  data: {}
}

export class Handlers
  implements PointerHandlers<SheetHandlerData, SheetHoverData>
{
  readonly pointers: CursorStyle[] = []

  constructor(readonly sheet: Sheet) {}

  onDragStart(at: Point): SheetHandlerData | null | undefined {
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

  onDragMove(to: Point, data: SheetHandlerData): void {
    data.ext.drag.move(data.data, to)
  }

  onDragEnd(at: Point, data: SheetHandlerData): void {
    const idx = this.pointers.lastIndexOf(data.cursor)
    if (idx != -1) this.pointers.splice(idx, 1)
    const cursor = this.pointers[this.pointers.length - 1]
    this.sheet.el.style.cursor = cursor || "auto"

    data.ext.drag.end(data.data, at)
  }

  onHoverStart(at: Point): SheetHoverData | null | undefined {
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

  onHoverMove(to: Point, data: SheetHoverData): boolean {
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

  onHoverEnd(_: Point, data: SheetHoverData): void {
    data.ext.hover.off(data.data)
    this.sheet.el.style.cursor =
      this.pointers[this.pointers.length - 1] || "default"
  }

  onUpgrade(
    at: Point,
    data: SheetHoverData,
  ): SheetHandlerData | null | undefined {
    data.ext.hover.off(data.data)
    this.sheet.el.style.cursor =
      this.pointers[this.pointers.length - 1] || "default"
    return this.onDragStart(at)
  }
}
