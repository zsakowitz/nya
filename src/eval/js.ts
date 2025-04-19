import type { SReal } from "@/lib/sreal"
import type { Node } from "./ast/token"
import { js } from "./ast/tx"
import type { BindingFn, Bindings } from "./lib/binding"
import type { JsContext } from "./lib/jsctx"
import { FNS } from "./ops"
import type { Sym } from "./sym"
import type { JsValue } from "./ty"

export interface PropsJs {
  base: SReal
  bindingsJs: Bindings<JsValue | BindingFn>
  bindingsSym: Bindings<Sym | BindingFn>
  ctxJs: JsContext
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

  return fn.js(
    props.ctxJs,
    args.map((arg) => js(arg, props)),
  )
}
