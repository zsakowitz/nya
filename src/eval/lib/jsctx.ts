import type { RequireRadiansContext, Sheet } from "@/sheet/ui/sheet"

export class JsContext {
  constructor(readonly sheet: Sheet) {}

  requireRadians(context: RequireRadiansContext) {
    this.sheet.requireRadians(context)
  }

  toRadians() {
    return this.sheet.toRadians()
  }

  toRadiansR32() {
    return this.sheet.toRadiansR32()
  }
}
