import { safe } from "../eval/lib/util"
import { div, recip } from "../eval/ops/op/div"
import { raise } from "../eval/ops/op/raise"
import type { SReal } from "../eval/ty"
import { frac, num, real } from "../eval/ty/create"
import { Display } from "../eval/ty/display"
import type { Cursor, Span } from "../field/model"

export function write(
  cursor: Cursor,
  value: SReal,
  baseRaw: SReal,
  stepExp: number,
) {
  const base = num(baseRaw)

  if (!(safe(base) && 2 <= base && base <= 36)) {
    new Display(cursor, baseRaw || frac(10, 1)).value(num(value))
    return
  }

  const display = new Display(cursor, baseRaw || frac(10, 1))
  const step = recip(raise(baseRaw, frac(stepExp, 1)))
  let main = Math.round(num(div(value, step)))
  if (main < 0) {
    display.digits("-")
    main = -main
  }
  let str = BigInt(main).toString(base)
  if (stepExp > 0) {
    str = str.padStart(stepExp, "0")
    str = (str.slice(0, -stepExp) || "0") + "." + str.slice(-stepExp)
    while (str[str.length - 1] == "0") {
      str = str.slice(0, -1)
    }
    if (str[str.length - 1] == ".") {
      str = str.slice(0, -1)
    }
  } else if (stepExp < 0) {
    str += "0".repeat(-stepExp)
  }

  display.digits(str)
}

/**
 * @param ratio (total options the user can choose from) / (total space
 *   available in math units)
 */
export function virtualStepExp(ratio: number, base: number) {
  return Math.ceil(Math.log(ratio) / Math.log(base))
}

export class Writer {
  constructor(readonly span: Span) {}

  setExact(value: SReal, precision: number) {
    write(this.span.remove(), value, frac(10, 1), virtualStepExp(precision, 10))
  }

  set(value: number, precision: number) {
    this.setExact(real(value), precision)
  }
}
