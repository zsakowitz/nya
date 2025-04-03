import { commalist } from "../ast/collect"
import type { Node, Var } from "../ast/token"
import type { Sym } from "../sym"
import type { GlslValue, JsValue } from "../ty"
import type { GlslContext } from "./fn"
import type { JsContext } from "./jsctx"
import { subscript } from "./text"

const encoder = new TextEncoder()

function hex(text: string) {
  const bytes = encoder.encode(text)
  let ret = ""
  for (let i = 0; i < bytes.length; i++) {
    ret += "0123456789abcdef"[Math.floor(bytes[i]! / 16)]
    ret += "0123456789abcdef"[bytes[i]! % 16]
  }
  return ret
}

export function id(name: Pick<Var, "value" | "sub">) {
  return hex(name.value) + (name.sub ? "SUB" + hex(subscript(name.sub)) : "")
}

export function tryId(name: Pick<Var, "value" | "sub">) {
  try {
    return hex(name.value) + (name.sub ? "SUB" + hex(subscript(name.sub)) : "")
  } catch {}
}

export class Bindings<T> {
  private viaWith: Record<string, T | undefined> = Object.create(null)
  private viaArgs: Record<string, T> = Object.create(null)

  constructor(private viaExprs: Record<string, T> = Object.create(null)) {}

  get(id: string): T | undefined {
    return this.viaArgs[id] ?? this.viaWith[id] ?? this.viaExprs[id]
  }

  withAll<U>(data: Record<string, T>, fn: () => U): U {
    const old: Record<string, PropertyDescriptor | undefined> =
      Object.create(null)
    const args: Record<string, true> = Object.create(null)
    try {
      for (const key in data) {
        const target =
          this.viaArgs[key] ? ((args[key] = true), this.viaArgs) : this.viaWith
        old[key] = Object.getOwnPropertyDescriptor(target, key)
        const next = Object.getOwnPropertyDescriptor(data, key)!
        Object.defineProperty(target, key, next)
      }
      return fn()
    } finally {
      for (const key in old) {
        const desc = old[key]
        const target = args[key] ? this.viaArgs : this.viaWith
        if (desc) {
          Object.defineProperty(target, key, desc)
        } else {
          delete target[key]
        }
      }
    }
  }

  with<U>(id: string, value: T, fn: () => U): U {
    const desc = Object.getOwnPropertyDescriptor(this.viaWith, id)
    this.viaWith[id] = value
    try {
      return fn()
    } finally {
      if (desc) {
        Object.defineProperty(this.viaWith, id, desc)
      } else {
        delete this.viaWith[id]
      }
    }
  }

  withArgs<U>(args: Record<string, T>, fn: () => U): U {
    Object.setPrototypeOf(args, null)
    const last = this.viaArgs
    try {
      this.viaArgs = args
      return fn()
    } finally {
      this.viaArgs = last
    }
  }

  withoutArgs<U>(fn: () => U): U {
    return this.withArgs(Object.create(null), fn)
  }
}

export const SYM_BINDINGS: Bindings<any> = new Proxy(
  Object.freeze(Object.create(null)),
  {
    get() {
      throw new Error(
        "Cannot access external bindings from a symbolic expression.",
      )
    },
  },
)

export type Binding = [id: string, contents: Node, name: string]
export type FnParam = [id: string, name: string]

export type Bound = Pick<Var, "value" | "sub">

export function name(node: Bound) {
  return node.value + (node.sub ? subscript(node.sub) : "")
}

export function tryName(node: Bound) {
  try {
    return name(node)
  } catch {
    try {
      return id(node)
    } catch {
      return "<unnameable>"
    }
  }
}

export function parseBindingVar(node: Node, kind: "with" | "for"): Binding {
  if (
    !(
      node.type == "cmplist" &&
      node.items.length == 2 &&
      node.ops.length == 1 &&
      node.ops[0] == "cmp-eq" &&
      node.items[0]?.type == "var" &&
      node.items[0].kind == "var" &&
      !node.items[0].sup &&
      node.items[1]
    )
  ) {
    throw new Error(
      `A '${kind}' statement looks like '${kind == "with" ? "with a = 2" : "for a = [1, 2, 3]"}'.`,
    )
  }

  return [id(node.items[0]), node.items[1], name(node.items[0])]
}

export function tryParseBindingVar(node: Node): Binding | undefined {
  if (
    !(
      node.type == "cmplist" &&
      node.items.length == 2 &&
      node.ops.length == 1 &&
      node.ops[0] == "cmp-eq" &&
      node.items[0]?.type == "var" &&
      node.items[0].kind == "var" &&
      !node.items[0].sup &&
      node.items[1]
    )
  ) {
    return
  }

  return [
    id(node.items[0]),
    node.items[1],
    node.items[0].value +
      (node.items[0].sub ? subscript(node.items[0].sub) : ""),
  ]
}

export function tryParseFnParam(node: Node): FnParam | undefined {
  if (!(node.type == "var" && node.kind == "var" && !node.sup)) {
    return
  }

  return [id(node), node.value + (node.sub ? subscript(node.sub) : "")]
}

export function parseUpdateVar(node: Node): Binding {
  if (
    !(
      node.type == "op" &&
      node.b &&
      node.a.type == "var" &&
      !node.a.sup &&
      node.a.kind == "var"
    )
  ) {
    throw new Error("An update expression looks like 'a->a+2'.")
  }

  return [
    id(node.a),
    node.b,
    node.a.value + (node.a.sub ? subscript(node.a.sub) : ""),
  ]
}

export function parseBindings<T>(node: Node, f: (node: Node) => T): T[] {
  if (node.type == "group" && node.lhs == "[" && node.rhs == "]") {
    node = node.value
  }
  return commalist(node).map(f)
}

export class BindingFn {
  constructor(
    readonly js: (ctx: JsContext, args: JsValue[]) => JsValue,
    readonly glsl: (ctx: GlslContext, args: GlslValue[]) => GlslValue,
    readonly sym: (ctx: JsContext, args: Sym[]) => Sym,
  ) {}
}

export class BindingGlslValue {
  constructor(readonly glsl: (ctx: GlslContext) => GlslValue) {}
}
