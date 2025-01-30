import type { Sheet } from "."
import type { Point, PointerHandlers } from "../paper"

interface SheetHandlerData {}

export class Handlers implements PointerHandlers<SheetHandlerData> {
  constructor(readonly sheet: Sheet) {}

  onDragStart(at: Point): SheetHandlerData | null | undefined {
    return
  }

  onDragMove(to: Point, data: SheetHandlerData): void {}

  onDragEnd(to: Point, data: SheetHandlerData): void {}

  onHover(at: Point): void {}
}
