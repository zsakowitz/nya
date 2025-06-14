import type { JsValue, TyName } from "@/eval/ty"
import { h } from "@/jsx"
import { Leaf } from "."

/**
 * Should only be used for `pick-cursor`. If this is displayed to the user, they
 * will be very confused, and something has probably gone very wrong.
 */
export class CmdValue<
  T extends TyName = TyName,
  L extends number | false = number | false,
> extends Leaf {
  constructor(readonly value: JsValue<T, L>) {
    super("\\nyavalue", h("", ""))
  }

  ascii(): string {
    return "nyavalue()"
  }

  reader(): string {
    return " RawValue "
  }

  latex(): string {
    return "\\nyavalue "
  }
}
