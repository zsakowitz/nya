import type { Node } from "./ast/token"
import { id, type Bound } from "./lib/binding"
import { iterateDeps, parseIterate } from "./ops/iterate"
import { VARS } from "./ops/vars"
import { withBindingsDeps } from "./ops/with"

export class Deps {
  readonly ids: Record<string, true> = Object.create(null)
  private readonly bound: Record<string, true | undefined> = Object.create(null)

  private trackByLabel(name: string) {
    if (this.bound[name]) return
    this.ids[name] = true
  }

  track(ast: Bound) {
    const myId = id(ast)
    this.trackByLabel(myId)
  }

  withBound<T>(ast: Bound, f: () => T): T {
    const myId = id(ast)
    const prev = this.bound[myId]
    try {
      this.bound[myId] = true
      return f()
    } finally {
      this.bound[myId] = prev
    }
  }

  withBoundIds<T>(ids: string[], f: () => T): T {
    const prev: typeof this.bound = Object.create(null)
    try {
      for (const key of ids) {
        if (!(key in prev)) {
          prev[key] = this.bound[key]
          this.bound[key] = true
        }
      }
      return f()
    } finally {
      for (const key in prev) {
        this.bound[key] = prev[key]
      }
    }
  }

  add(node: Node) {
    deps(node, this)
  }

  isBound(id: string) {
    return !!this.bound[id]
  }
}

export function deps(node: Node, deps: Deps) {
  switch (node.type) {
    case "num":
      if (node.sub) {
        deps.add(node.sub)
      }
      break
    case "op":
      if (!node.b) {
        deps.add(node.a)
        break
      }
      if (node.kind == "with" || node.kind == "withseq") {
        deps.withBoundIds(
          withBindingsDeps(node.b, node.kind == "withseq", deps),
          () => deps.add(node.a),
        )
        break
      }
      deps.add(node.a)
      deps.add(node.b)
      break
    case "group":
      deps.add(node.value)
      break
    case "call":
      if (
        node.name.type == "var" &&
        node.name.kind == "prefix" &&
        !node.name.sub &&
        !node.name.sup
      ) {
        deps.add(node.args)
        if (node.on) {
          deps.add(node.on)
        }
      }
      break
    case "juxtaposed":
      for (const x of node.nodes) {
        deps.add(x)
      }
      break
    case "var": {
      if (deps.isBound(id(node))) {
        if (node.sup) {
          deps.add(node.sup)
        }
        break
      }

      builtin: {
        if (node.sub) break builtin

        const value = VARS[node.value]?.glsl
        if (!value) break builtin

        if (node.sup) {
          deps.add(node.sup)
        }
        break
      }

      deps.add(node)
      if (node.sup) {
        deps.add(node.sup)
      }
      break
    }
    case "frac":
      deps.add(node.a)
      deps.add(node.b)
      break
    case "raise":
      deps.add(node.base)
      deps.add(node.exponent)
      break
    case "cmplist":
      for (const item of node.items) {
        deps.add(item)
      }
      break
    case "piecewise":
      for (const { condition, value } of node.pieces) {
        deps.add(condition)
        deps.add(value)
      }
      break
    case "error":
      throw new Error(node.reason)
    case "magicvar":
      if (node.value == "iterate") {
        const parsed = parseIterate(node, { source: "expr" })
        iterateDeps(parsed, deps)
      }
      break
    case "void":
      break
    case "index":
      deps.add(node.on)
      deps.add(node.index)
      break
    case "commalist":
      for (const item of node.items) {
        deps.add(item)
      }
      break
    case "sub":
      throw new Error("Invalid subscript.")
    case "sup":
      deps.add(node.sup)
      break
    case "mixed":
      break
    case "root":
      if (node.root) {
        deps.add(node.root)
      }
      deps.add(node.contents)
      break
    case "num16":
      break
    case "matrix":
      for (const value of node.values) {
        deps.add(value)
      }
      break
    // @ts-expect-error fallthrough is intentional
    case "big":
      deps.add(node.of)
    case "bigsym":
      if (node.sub) deps.add(node.sub)
      if (node.sup) deps.add(node.sup)
      break
    case "factorial":
      deps.add(node.on)
      if (typeof node.repeats != "number") {
        deps.add(node.repeats)
      }
      break
    case "punc":
      break
  }

  throw new Error(
    `Node type '${node.type}' is not implemented for shaders yet.`,
  )
}
