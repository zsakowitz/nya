import type { Node } from "./ast/token"
import { AST_TXRS } from "./ast/tx"
import { Bindings } from "./lib/binding"
import { GlslContext, GlslHelpers } from "./lib/fn"
import { FNS } from "./ops"
import type { GlslValue, JsValue, SReal } from "./ty"
import { real } from "./ty/create"

export interface PropsGlsl {
  base: SReal
  ctx: GlslContext
  /** GLSL bindings must contain variable names and be properly typed. */
  bindings: Bindings<GlslValue>
  bindingsJs: Bindings<JsValue>
}

export function defaultPropsGlsl(): PropsGlsl {
  return {
    base: real(10),
    ctx: new GlslContext(new GlslHelpers()),
    bindings: new Bindings(),
    bindingsJs: new Bindings(),
  }
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

  return fn.glsl(props.ctx, ...args.map((arg) => glsl(arg, props)))
}

export function glsl(node: Node, props: PropsGlsl): GlslValue {
  return AST_TXRS[node.type].glsl(node as never, props)
}
