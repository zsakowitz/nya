import type { RequireRadiansContext, Sheet } from "@/sheet/ui/sheet"

export class JsContext {
  constructor(readonly sheet: Sheet | null) {}

  requireRad(context: RequireRadiansContext) {
    this.sheet?.requireRadians(context)
  }

  rad(): number {
    return this.sheet?.toRadians() ?? 1
  }
}
