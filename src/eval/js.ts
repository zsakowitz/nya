import type { Node } from "./ast/token"
import { Bindings } from "./lib/binding"
import { FNS } from "./ops"
import { AST_TXRS } from "./ast/tx"
import type { JsValue, SReal } from "./ty"
import { real } from "./ty/create"

export interface PropsJs {
  base: SReal
  /** JS bindings must be values. */
  bindingsJs: Bindings<JsValue>
}

export function defaultPropsJs(): PropsJs {
  return {
    base: real(10),
    bindingsJs: new Bindings(),
  }
}

export function jsCall(
  name: string,
  args: Node[],
  _asMethod: boolean,
  props: PropsJs,
): JsValue {
  const fn = FNS[name]

  if (!fn) {
    throw new Error(`The '${name}' function is not supported yet.`)
  }

  return fn.js(...args.map((arg) => js(arg, props)))
}

export function js(node: Node, props: PropsJs): JsValue {
  return AST_TXRS[node.type].js(node as never, props)
}
