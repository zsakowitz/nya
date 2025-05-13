import { inspect } from "util"
import { emitGlslMat, emitGlslVec, type Repr } from "./repr"
import { Fn, Scalar, Struct } from "./type"

const black = "\u001b[30m"
const blue = "\u001b[34m"
const C = "\u001b[36m"
const G = "\u001b[32m"
const M = "\u001b[35m"
const red = "\u001b[31m"
const R = "\u001b[0m"
const white = "\u001b[37m"
const Y = "\u001b[33m"
black
blue
red
white

function showRepr(repr: Repr) {
  switch (repr.type) {
    case "void":
      return Y + "void" + R
    case "vec":
      return Y + emitGlslVec(repr) + R
    case "mat":
      return Y + emitGlslMat(repr) + R
    case "struct":
      return Y + "struct " + repr.id + R
  }
}

export function addInspectKeys() {
  ;(Scalar.prototype as any)[inspect.custom] = function (this: Scalar) {
    return `Scalar { ${this.name} }`
  }
  ;(Struct.prototype as any)[inspect.custom] = function (this: Scalar) {
    return `Struct { ${G}"${this.name}"${R} ${C}${this.emit}${R} ${Y}via ${showRepr(this.repr)} }`
  }
  ;(Fn.prototype as any)[inspect.custom] = function (this: Fn) {
    return `fn ${Y}${this.id.label}${Y}(${this.args
      .map((x) => `${R}${x.name}: ${M}${x.type}${R}`)
      .join(", ")}${Y}) ${R}-> ${M}${this.ret}${R}`
  }
}
