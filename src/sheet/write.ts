import { TBD } from "@/error"
import type { Cursor } from "@/field/model"
import { int, type SReal } from "@/lib/real"

const Display = TBD
export function write(
  cursor: Cursor,
  value: SReal,
  baseRaw: SReal,
  stepExp: number,
  signed = false,
) {
  const base = baseRaw.num()

  if (!(base == Math.floor(base) && 2 <= base && base <= 36)) {
    // new Display(cursor, baseRaw || int(10)).value(value.num(), signed)
    return
  }

  const display = new Display(cursor, baseRaw || int(10))
  const step = baseRaw.pow(int(stepExp)).inv()
  let main = Math.round(value.div(step).num())
  if (main < 0) {
    display.digits("-")
    main = -main
  } else if (signed) {
    display.digits("+")
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
