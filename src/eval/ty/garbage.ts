import type { JsVal, JsValue, Ty, Type } from "."
import { pt, real } from "./create"

export function garbageValJs(ty: Ty): JsVal {
  switch (ty.type) {
    case "real":
      return { type: "real", value: real(NaN) }
    case "complex":
      return { type: "complex", value: pt(real(NaN), real(NaN)) }
    case "color":
      return {
        type: "color",
        value: { type: "color", r: real(NaN), g: real(NaN), b: real(NaN) },
      }
    case "bool":
      return { type: "bool", value: false }
  }
}

export function garbageValGlsl(ty: Ty): string {
  switch (ty.type) {
    case "real":
      return "(.0/.0)"
    case "complex":
      return "vec2(.0/.0)"
    case "color":
      return "vec3(.0/.0)"
    case "bool":
      return "false"
  }
}

export function garbageValueJs(ty: Type): JsValue {
  if (ty.list === false) {
    return { ...garbageValJs(ty), list: false }
  }

  const val = garbageValJs(ty).value as any

  return {
    type: ty.type,
    value: Array.from({ length: ty.list }, () => val),
    list: true,
  }
}

export function garbageValueGlsl(ty: Type): string {
  if (ty.list === false) {
    return garbageValGlsl(ty)
  }

  const val = garbageValGlsl(ty)

  return "[" + Array.from({ length: ty.list }, () => val).join(",") + "]"
}
