import type { Type } from "."
import { TY_INFO } from "./info"

export function declareGlsl(ty: Type, name: string) {
  return `${TY_INFO[ty.type].glsl} ${name}${ty.list === false ? "" : `[${ty.list}]`}`
}
