import type { Node } from "./ast/token"
import { TXR_AST } from "./ast/tx"
import { Bindings, type BindingFn } from "./lib/binding"
import { FNS } from "./ops"
import type { Sym } from "./sym"
import type { JsValue, SReal } from "./ty"

export interface PropsJs {
  base: SReal
  bindingsJs: Bindings<JsValue | BindingFn>
  bindingsSym: Bindings<Sym | BindingFn>
}

export function jsCall(
  name: string,
  rawName: string,
  args: Node[],
  props: PropsJs,
): JsValue {
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

  return fn.js(args.map((arg) => js(arg, props)))
}

export function js(node: Node, props: PropsJs): JsValue {
  const txr = TXR_AST[node.type]
  if (!txr) {
    throw new Error(`The '${node.type}' transformer is not defined.`)
  }
  return txr.js(node as never, props)
}
