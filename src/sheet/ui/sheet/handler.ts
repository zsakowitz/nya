import type { Sheet } from "."
import type { AnyExt } from "../../ext"
import type { Expr } from "../expr"
import type { Point, PointerHandlers } from "../paper"

interface SheetHandlerData {
  expr: Expr
  ext: AnyExt & { drag: {} }
  data: {}
}

export class Handlers implements PointerHandlers<SheetHandlerData> {
  constructor(readonly sheet: Sheet) {}

  onDragStart(at: Point): SheetHandlerData | null | undefined {
    for (const expr of this.sheet.exprs
      .filter(
        (x): x is typeof x & { state: { ok: true; ext: { drag: {} } } } =>
          x.state.ok && !!x.state.ext?.drag,
      )
      .sort((a, b) => b.layer - a.layer)) {
      const dragData = expr.state.ext.drag.start(expr.state.data, at)
      if (dragData != null) {
        return {
          expr,
          ext: expr.state.ext,
          data: dragData,
        }
      }
    }

    return
  }

  onDragMove(to: Point, data: SheetHandlerData): void {
    data.ext.drag.move(data.data, to)
  }

  onDragEnd(at: Point, data: SheetHandlerData): void {
    data.ext.drag.end(data.data, at)
  }

  onHover(): void {}
}
