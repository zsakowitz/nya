import type { GlslValue, JsValue, Val } from "@/eval/ty"
import type { GlslContext } from "./lib/fn"
import { TY_INFO, type TyInfo } from "./ty/info"

export function jsToGlsl(js: JsValue, ctx: GlslContext): GlslValue {
  const cv = (TY_INFO[js.type] as TyInfo<Val>).toGlsl

  if (js.list === false) {
    return {
      type: js.type,
      list: false,
      expr: cv(js.value, ctx),
    }
  }

  const expr = ctx.name()
  ctx.push`${TY_INFO[js.type].glsl} ${expr}[${js.list}];\n`

  for (let i = 0; i < js.list; i++) {
    ctx.push`${expr}[${i}] = ${cv(js.value[i]!, ctx)};\n`
  }

  return { type: js.type, list: js.list, expr }
}
