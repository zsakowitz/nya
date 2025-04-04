import type { RequireRadiansContext, Sheet } from "@/sheet/ui/sheet"

export class JsContext {
  constructor(readonly sheet: Sheet) {}

  requireRadians(context: RequireRadiansContext) {
    this.sheet.requireRadians(context)
  }

  rad() {
    return this.sheet.toRadians()
  }
}
