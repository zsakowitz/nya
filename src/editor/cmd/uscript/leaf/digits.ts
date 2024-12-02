import { h, usvg } from "../../../jsx"
import { L, type Cursor, type InitRet } from "../../../model"
import { Leaf } from "../../leaf"

const Q = 2.1

const DIGITS = {
  0: `M 1.75 ${2 - Q} a ${Q} ${Q} 180 0 0 0 ${2 * Q} a ${Q} ${Q} 180 0 0 0-${2 * Q}`,
  f: "M 0 2 h 3.5 M 1.07 1.25 v 1.5 M 2.43 1.25 v 1.5",

  1: "M 0 0.75 h 3.5 V 4 M 1.55 0 v 1.6",
  7: "M 0 0 v 3.25 h 3.5 M 1.95 2.4 v 1.6",
  8: "M 3.5 0.75 h-3.5 V 4 M 1.95 0 v 1.6",
  e: "M 3.5 0 v 3.25 h-3.5 M 1.55 2.4 v 1.6",

  // v1: "M -1 -1.2 h 1.5 l -1 1.2 L 0 0 h 4 v 4 M 2-1 v 2",
  // v7: "M -1 -1.2 h 1.5 l -1 1.2 L 1 0 v 4 H 4 M 2 3 v 2",

  2: "M 0 0 h 1.5 l 1 3.6 l 1-3.6",
  4: "M 0 0 l 1 3.6 l 1-3.6 h 1.5",
  b: "M 0 4 l 1-3.6 l 1 3.6 h 1.5",
  d: "M 0 4 h 1.5 l 1-3.6 l 1 3.6",

  3: "M 0 0 h 1.75 v 4 h 1.75",
  c: "M 0 4 h 1.75 v-4 h 1.75",

  5: "M 0 0 l 1.17 3.8 l 1.17-3.6 l 1.17 3.8",
  a: "M 0 4 l 1.17-3.8 l 1.17 3.6 l 1.17-3.8",

  6: "M 0 0 v 4 h 3.5 v-4",
  9: "M 0 4 v-4 h 3.5 v 4",
}

export type Digit = `${keyof typeof DIGITS}`

export class CmuDigit extends Leaf {
  static init(cursor: Cursor, input: string): InitRet {
    if (Object.keys(DIGITS).indexOf(input) != -1) {
      new CmuDigit(input as Digit).insertAt(cursor, L)
    }
  }

  constructor(readonly digit: Digit) {
    super(
      digit,
      h(
        "",
        usvg(
          "overflow-visible inline-block h-[1em] align-[-.2em]",
          "0 0 3.5 4",
          DIGITS[digit],
        ),
      ),
    )
  }

  ascii(): string {
    return this.digit
  }

  latex(): string {
    return this.digit
  }

  reader(): string {
    return this.digit
  }
}
