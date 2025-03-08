import type { Node } from "./ast/token"
import { TXR_AST } from "./ast/tx"
import { Bindings, type BindingFn } from "./lib/binding"
import { GlslContext } from "./lib/fn"
import { FNS } from "./ops"
import type { GlslValue, JsValue, SReal } from "./ty"

export interface PropsSym {
  base: SReal
}

export interface PropsGlsl {
  base: SReal
  ctx: GlslContext
  /** GLSL bindings must contain variable names and be properly typed. */
  bindings: Bindings<GlslValue | BindingFn>
  bindingsJs: Bindings<JsValue | BindingFn>
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
