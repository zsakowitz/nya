import type { TyName, Type, Val } from "."
import type { GlslContext } from "../fn"
import { TY_INFO } from "./info"

export function garbageValueGlsl(ctx: GlslContext, type: Type): string {
  if (type.list === false) {
    return TY_INFO[type.type].garbage.glsl
  }

  const ret = ctx.name()
  const index = ctx.name()
  ctx.push`${TY_INFO[type.type].glsl} ${ret}[${type.list}];\n`
  ctx.push`for (int ${index} = 0; ${index} < ${type.list}; ${index}++) {\n`
  ctx.push`${ret}[${index}] = ${TY_INFO[type.type].glsl};\n`
  ctx.push`}\n`
  return ret
}

export function garbageValueJs(type: Type<TyName, false>): Val
export function garbageValueJs(type: Type<TyName, number>): Val[]
export function garbageValueJs(type: Type): Val | Val[]
export function garbageValueJs(type: Type): Val | Val[] {
  if (type.list === false) {
    return TY_INFO[type.type].garbage.js
  }

  return Array<Val>(type.list).fill(TY_INFO[type.type].garbage.js)
}
