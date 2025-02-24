import type { Node } from "./ast/token"
import { TXR_AST } from "./ast/tx"
import { Bindings, type BindingFn } from "./lib/binding"
import { FNS } from "./ops"
import type { JsValue, SReal } from "./ty"

export interface PropsJs {
  base: SReal
  bindingsJs: Bindings<JsValue | BindingFn>
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

  return fn.js(args.map((arg) => js(arg, props)))
}

export function js(node: Node, props: PropsJs): JsValue {
  const txr = TXR_AST[node.type]
  if (!txr) {
    throw new Error(`The '${node.type}' transformer is not defined.`)
  }
  return txr.js(node as never, props)
}
