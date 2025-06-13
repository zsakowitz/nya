import type { ParenLhs, ParenRhs } from "@/field/cmd/math/brack"
import { IdMap } from "../../lang/src/emit/decl"
import { todo } from "../../lang/src/emit/error"
import { Id, ident } from "../../lang/src/emit/id"
import type { EntrySet } from "../../lang/src/exec/item"
import type { NameCooked, Node, OpKind, Suffix, SuffixKind } from "./node"

export class ScriptBlock {
  constructor(
    readonly set: EntrySet,
    readonly tightLocals: IdMap<string>,
    readonly leakyLocals: IdMap<string>,
  ) {}

  local(name: NameIdent): string | null {
    const early =
      this.tightLocals.get(ident(name)) ?? this.leakyLocals.get(ident(name))
    if (early != null) return early

    const value = this.set.global(name)
    return value == null ? null : this.evalInSeparateScope(value)
  }

  localOrFn(name: NameIdent): string | { args: string[]; body: string } | null {
    const early =
      this.tightLocals.get(ident(name)) ?? this.leakyLocals.get(ident(name))
    if (early != null) return early

    const value = this.set.globalOrFn(name)
    if (value == null) {
      return null
    }
    if (value.args == null) {
      return this.evalInSeparateScope(value.of)
    }

    const map = new IdMap<string>(null)
    const args = value.args.map((x) => {
      const internalName = new Id(x).ident()
      map.set(ident(x), internalName)
      return internalName
    })
    return {
      args,
      body: new ScriptBlock(this.set, map, this.leakyLocals).eval(value.of),
    }
  }

  evalInSeparateScope(node: Node): string {
    return new ScriptBlock(this.set, new IdMap(null), this.leakyLocals).eval(
      node,
    )
  }

  eval(node: Node): string {
    switch (node.data.type) {
      case "group":
        return (
          TX_OPS_GROUP[node.data.data.lhs]?.[node.data.data.rhs] ??
          todo(
            `${node.data.data.lhs}...${node.data.data.rhs} brackets are not supported yet.`,
          )
        ).eval(node.data.data, node.args ?? [], this)

      case "op":
        const op = TX_OPS_OPS[node.data.data]
        if (op) {
          return op.eval(node.data.data, node.args ?? [], this)
        }
    }

    const txr =
      TX_OPS[node.data.type] ??
      todo(`'${node.data.type}' nodes are not implemented yet.`)

    return txr.eval(node.data.data as never, node.args ?? [], this)
  }

  evalSuffix(op: Suffix, on: string): string {
    const txr =
      TX_SUFFIXES[op.type] ??
      todo(`'${op.type}' suffixes are not implemented yet.`)
    return txr.eval(op.data as never, on, this)
  }

  evalList(node: Node): string[] {
    return listItems(node).map((x) => this.eval(x))
  }

  of(text: TemplateStringsArray, ...items: Node[]): string {
    let ret = text[0]!
    for (let i = 1; i < text.length; i++) {
      ret += this.eval(items[i - 1]!)
      ret += text[i]!
    }
    return ret
  }
}

export class ScriptDeps {
  readonly deps = new Set<string>()

  add(name: NameCooked): void {
    this.deps.add(nameIdent(name))
  }

  check(node: Node | null) {
    if (node == null) {
      return
    }

    switch (node.data.type) {
      case "group":
        return (
          TX_OPS_GROUP[node.data.data.lhs]?.[node.data.data.rhs] ??
          todo(
            `${node.data.data.lhs}...${node.data.data.rhs} brackets are not supported yet.`,
          )
        ).deps(node.data.data, node.args ?? [], this)

      case "op":
        const op = TX_OPS_OPS[node.data.data]
        if (op) {
          return op.deps(node.data.data, node.args ?? [], this)
        }
    }

    const txr =
      TX_OPS[node.data.type] ??
      todo(`'${node.data.type}' nodes are not implemented yet.`)

    return txr.deps(node.data.data as never, node.args ?? [], this)
  }
}

export type ReadonlyScriptDeps = Pick<ScriptDeps, "deps">

export function subscript(node: Node): string {
  switch (node.data.type) {
    case "num":
      return node.data.data
    case "uvar":
      if (node.data.data.sub) break
      return node.data.data.name
    case "op":
      if (node.data.data != "%juxtapose") break
      return subscript(node.args![0]!) + subscript(node.args![1]!)
  }
  throw new Error("Subscripts may only contain letters are numbers.")
}

export type NameIdent = string & { __brand_name_ident: undefined }

export function nameIdent(name: NameCooked): NameIdent {
  return ("_u" +
    Id.prototype.ident.call(
      ident(name.name + (name.sub ? "_" + name.sub : "")),
    )) as NameIdent
}

export interface TxOp<T> {
  eval(op: T, children: readonly Node[], block: ScriptBlock): string
  deps(op: T, children: readonly Node[], deps: ScriptDeps): void
}

export type TxGroup = TxOp<OpKind["group"]>
export type TxOpOp = TxOp<OpKind["op"]>

export interface TxSuffix<T> {
  eval(op: T, on: string, block: ScriptBlock): string
  deps(op: T, on: null, deps: ScriptDeps): void
}

export type TxOps = {
  [K in keyof OpKind as Exclude<K, "group">]?: TxOp<OpKind[K]>
}
export type TxOpsGroup = { [L in ParenLhs]?: { [R in ParenRhs]?: TxGroup } }
export type TxOpsOps = { [x: string]: TxOpOp }
export type TxSuffixes = { [K in keyof SuffixKind]?: TxSuffix<SuffixKind[K]> }

export const TX_OPS: TxOps = Object.create(null)
export const TX_SUFFIXES: TxSuffixes = Object.create(null)
export const TX_OPS_GROUP: TxOpsGroup = Object.create(null)
export const TX_OPS_OPS: TxOpsOps = Object.create(null)

export function setGroupTxr(lhs: ParenLhs, rhs: ParenRhs, group: TxGroup) {
  ;(TX_OPS_GROUP[lhs] ??= Object.create(null))[rhs] = group
}

export function listItems(node: Node): Node[] {
  if (node.data.type != "list") {
    return [node]
  }

  if (!node.args?.length) {
    return []
  }

  const ret = [node.args[0]!]
  let rest = node.args[1]
  while (rest?.data.type == "list") {
    ret.push(rest.args![0]!)
    rest = rest.args![1]
  }
  if (rest) {
    ret.push(rest)
  }
  return ret
}
