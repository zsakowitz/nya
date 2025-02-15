import type { GlslValue, JsValue } from "../../ty"
import { isReal } from "../../ty/coerce"
import { num } from "../../ty/create"
import { TY_INFO } from "../../ty/info"

export function indexJs(on: JsValue, index: JsValue): JsValue {
  if (on.list === false) {
    throw new Error("Cannot index on a non-list.")
  }
  if (index.list !== false) {
    throw new Error("Cannot index with a list yet.")
  }
  if (!isReal(index)) {
    throw new Error("Indexes must be numbers for now.")
  }
  const value = num(index.value) - 1
  return {
    type: on.type,
    list: false,
    value: on.value[value] ?? TY_INFO[on.type].garbage.js,
  }
}

export function indexGlsl(on: GlslValue, indexVal: JsValue): GlslValue {
  if (on.list === false) {
    throw new Error("Cannot index on a non-list.")
  }
  if (indexVal.list !== false) {
    throw new Error("Cannot index with a list yet.")
  }
  if (!isReal(indexVal)) {
    throw new Error("Indices must be numbers for now.")
  }
  const index = num(indexVal.value)
  if (index != Math.floor(index) || index <= 0 || index > on.list) {
    throw new Error(
      `Index ${index} is out-of-bounds on list of length ${on.list}.`,
    )
  }
  return {
    type: on.type,
    list: false,
    expr: `${on.expr}[${index - 1}]`,
  }
}
