import type { Node } from "./ast/token"
import { TXR_AST } from "./ast/tx"
import type { PropsJs } from "./js"
import type { BindingFn, BindingGlslValue, Bindings } from "./lib/binding"
import type { GlslContext } from "./lib/fn"
import { FNS } from "./ops"
import type { GlslValue, JsValue, Val } from "./ty"
import { TY_INFO, type TyInfo } from "./ty/info"

// TODO: DEBT: remove alias; sym and js operate in identical environments and have access to each other
export type PropsSym = PropsJs

export interface PropsGlsl extends PropsSym {
  ctx: GlslContext
  // TODO: DEBT: should be bindingsGlsl
  /** GLSL bindings must contain variable names and be properly typed. */
  bindings: Bindings<GlslValue | BindingGlslValue | BindingFn>
}

export function glslCall(
  name: string,
  rawName: string,
  args: Node[],
  props: PropsGlsl,
): GlslValue {
  const fn = FNS[name]

  if (!fn) {
    if (name.endsWith("_^-1")) {
      if (FNS[rawName + "_"]) {
        throw new Error(
          `'${rawName}' only supports positive integer superscripts.`,
        )
      }
      if (FNS[rawName + "^-1"]) {
        throw new Error(`Cannot attach a subscript to '${rawName}'.`)
      }
      if (FNS[rawName]) {
        throw new Error(
          `'${rawName}' only supports positive integer superscripts.`,
        )
      }
    } else if (name.endsWith("^-1")) {
      if (FNS[rawName]) {
        throw new Error(
          `'${rawName}' only supports positive integer superscripts.`,
        )
      }
    } else if (name.endsWith("_")) {
      if (FNS[rawName]) {
        throw new Error(`Cannot attach a subscript to '${rawName}'.`)
      }
    }

    throw new Error(`'${rawName}' is not supported yet.`)
  }

  return fn.glsl(
    props.ctx,
    args.map((arg) => glsl(arg, props)),
  )
}

export function glsl(node: Node, props: PropsGlsl): GlslValue {
  const txr = TXR_AST[node.type]
  if (!txr) {
    throw new Error(`The '${node.type}' transformer is not defined.`)
  }
  return txr.glsl(node as never, props)
}

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
