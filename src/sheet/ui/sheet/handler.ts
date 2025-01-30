import type { Sheet } from "."
import type { PointerHandlers } from "../paper"

interface SheetHandlerData {}

export class Handlers implements PointerHandlers<SheetHandlerData> {
  constructor(readonly sheet: Sheet) {}

  onDragStart(): SheetHandlerData | null | undefined {
    return
  }

  onDragMove(): void {}

  onDragEnd(): void {}

  onHover(): void {}
}
