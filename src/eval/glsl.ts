import type { Node } from "./ast/token"
import { TXR_AST } from "./ast/tx"
import { Bindings, type BindingFn } from "./lib/binding"
import { GlslContext } from "./lib/fn"
import { FNS } from "./ops"
import type { GlslValue, JsValue, SReal } from "./ty"

export interface PropsGlsl {
  base: SReal
  ctx: GlslContext
  /** GLSL bindings must contain variable names and be properly typed. */
  bindings: Bindings<GlslValue | BindingFn>
  bindingsJs: Bindings<JsValue | BindingFn>
}

export function glslCall(
  name: string,
  args: Node[],
  _asMethod: boolean,
  props: PropsGlsl,
): GlslValue {
  const fn = FNS[name]

  if (!fn) {
    throw new Error(`The '${name}' function is not supported in shaders yet.`)
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
