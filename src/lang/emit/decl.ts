import type { Pos } from "!/ast/issue"
import type { ExprLit } from "../ast/node/expr"
import { Coercions } from "./coerce"
import { bug, issue, todo } from "./error"
import { Id, ident, type IdGlobal } from "./id"
import type { EmitProps } from "./props"
import type { Tag } from "./tag"
import {
  invalidType,
  FixedArray,
  Scalar,
  type Fn,
  type FnType,
  type Type,
} from "./type"
import { Value } from "./value"

export class IdMap<T> {
  constructor(private readonly parent: IdMap<T> | null) {}

  private readonly map: Record<number, T> = Object.create(null)

  all() {
    return Object.entries(this.map)
  }

  get(id: IdGlobal): T | undefined {
    return this.map[id.value] ?? this.parent?.get(id)
  }

  has(id: IdGlobal): boolean {
    return id.value in this.map || (this.parent != null && this.parent?.has(id))
  }

  /** Inverse of `.has`, but doesn't check parent scopes. */
  canDefine(id: IdGlobal) {
    return !(id.value in this.map)
  }

  /** Returns a value if it's already been initialized. */
  init(id: IdGlobal, value: T): T {
    if (this.has(id)) {
      return this.get(id)!
    }
    return (this.map[id.value] = value)
  }

  setOrThrow(
    id: IdGlobal,
    value: T,
    message = `'${id.label}' is already defined.`,
  ) {
    if (!this.canDefine(id)) {
      bug(message)
    }
    this.map[id.value] = value
  }

  set(id: IdGlobal, value: T) {
    this.map[id.value] = value
    return this
  }
}

export class IdMapMany<T> {
  private readonly rec: Record<number, T[]> = Object.create(null)

  all() {
    return Object.values(this.rec)
  }

  get(id: IdGlobal) {
    return this.rec[id.value]
  }

  push(id: IdGlobal, value: T) {
    ;(this.rec[id.value] ??= []).push(value)
  }

  map<U>(f: (items: T[], index: number, array: T[][]) => U): U[] {
    return Object.values(this.rec).map(f)
  }

  mapEach<U>(f: (items: T, index: number, array: T[]) => U): U[] {
    return Object.values(this.rec).flat().map(f)
  }

  alias(src: IdGlobal, dst: IdGlobal) {
    this.rec[dst.value] ??= this.rec[src.value] ??= []
  }
}

export class Declarations {
  readonly types: IdMap<Type>
  readonly fns: IdMapMany<Fn>
  readonly tags: IdMap<Tag>
  readonly coercions = new Coercions()

  private _tyVoid: Scalar | undefined
  get tyVoid() {
    return (this._tyVoid ??= this.types.get(ident("void")) as Scalar)
  }

  private _tyBool: Scalar | undefined
  get tyBool() {
    return (this._tyBool ??= this.types.get(ident("bool")) as Scalar)
  }

  private _tyNum: Scalar | undefined
  get tyNum() {
    return (this._tyNum ??= this.types.get(ident("num")) as Scalar)
  }

  private _tyLatex: Scalar | undefined
  get tyLatex() {
    return (this._tyLatex ??= this.types.get(ident("latex")) as Scalar)
  }

  private _tySym: Scalar | undefined
  get tySym() {
    return (this._tySym ??= this.types.get(ident("sym")) as Scalar)
  }

  ty(name: string): Scalar | undefined {
    const ty = this.types.get(ident(name))
    if (ty instanceof Scalar) {
      return ty
    }
  }

  void() {
    return new Value(0, this.tyVoid, true)
  }

  constructor(
    readonly props: EmitProps,
    parent: Declarations | null,
    readonly createLiteral: (literal: ExprLit) => Value,
    readonly toArraySize: (value: Value) => number | null,
  ) {
    this.types = new IdMap(parent?.types ?? null)
    this.fns = parent?.fns ?? new IdMapMany()
    this.tags = new IdMap(parent?.tags ?? null)
  }

  private readonly typeDeclarations = new Set<string>()
  addTypeDeclaration(text: string) {
    this.typeDeclarations.add(text)
  }
  getTypeDeclarations() {
    return Array.from(this.typeDeclarations).join("\n")
  }
}

export class Exits {
  concreteReturnType: Type | undefined

  constructor(
    readonly returnType: FnType | null,
    readonly cannotReturnDueToGenericFn?: boolean,
  ) {}

  return(value: Value, pos: Pos, overrideGenericFnIgnore?: boolean) {
    if (this.cannotReturnDueToGenericFn) {
      if (!overrideGenericFnIgnore) {
        todo(`Cannot use 'return' in generic functions yet.`, pos)
      }
    }
    if (!this.returnType) {
      issue(`Cannot return from this context.`, pos)
    }
    if (!this.returnType.canConvertFrom(value.type)) {
      invalidType(this.returnType, value.type, pos)
    }
    const ret = this.returnType.convertFrom(value, pos)
    if (this.concreteReturnType) {
      if (this.concreteReturnType != ret.type) {
        invalidType(this.concreteReturnType, ret.type, pos)
      }
    } else {
      this.concreteReturnType = ret.type
    }
    return ret
  }
}

export class BlockGlobals {
  private readonly sources = new Set<string>()

  constructor(readonly decl: Declarations) {}

  add(text: string) {
    this.sources.add(text)
  }

  addAll(texts: ReadonlySet<string>) {
    for (const el of texts) {
      this.sources.add(el)
    }
  }

  get(): ReadonlySet<string> {
    return this.sources
  }

  getText(): string {
    return Array.from(this.sources).join("\n")
  }
}

export class Block {
  source = ""

  get decl() {
    return this.globals.decl
  }

  get props() {
    return this.globals.decl.props
  }

  get lang() {
    return this.globals.decl.props.lang
  }

  constructor(
    readonly globals: BlockGlobals,
    readonly exits: Exits,
    readonly locals: IdMap<Value> = new IdMap(null),
  ) {}

  cache(value: Value, assumeReadonly: boolean): Value {
    if (value.const() && !Array.isArray(value.value)) {
      return value
    } else if (value.type.repr.type == "void") {
      return new Value(0, value.type, true)
    } else if (assumeReadonly) {
      const v = value.toString()
      if (PRECACHED.test(v)) {
        return value
      }
    }

    const ident = new Id("cached value").ident()
    this.source += `${this.props.lang == "glsl" ? value.type.emit : "var"} ${ident}=${value};`
    return new Value(ident, value.type, false)
  }

  child(exits: Exits) {
    return new Block(this.globals, exits, new IdMap(this.locals))
  }

  addGlobal(source: string) {
    this.globals.add(source)
  }

  addGlobalsFrom(sources: BlockGlobals) {
    this.globals.addAll(sources.get())
  }

  map(count: number, item: (index: Value, block: Block) => Value): Value {
    const child = this.child(this.exits)
    const idxId = new Id("loop index").ident()
    const index = new Value(idxId, this.decl.tyNum, false)
    const inner = item(index, child)
    const type = new FixedArray(this.decl.props, inner.type, count)

    const loopHead = `for(${this.lang == "glsl" ? "int" : "var"} ${idxId}=0;${idxId}<${count};${idxId}++){`
    const loopTail = `}`

    if (type.repr.type == "void") {
      if (child.source != "") {
        this.source += `${loopHead}${child.source}${loopTail}`
      }
      return new Value(0, type, true)
    }

    if (inner.const()) {
      if (child.source != "") {
        this.source += `${loopHead}${child.source}${loopTail}`
      }
      return new Value(
        Array.from({ length: count }, () => inner.value),
        type,
        true,
      )
    }

    const retId = new Id("loop return array").ident()
    const ret = new Value(retId, type, false)
    const retDecl =
      this.lang == "glsl" ? `${type} ${retId};` : `let ${retId}=[];`
    const innerRuntime = inner.toString()
    this.source += `${retDecl}${loopHead}${child.source}${retId}[${idxId}]=${innerRuntime};${loopTail}`
    return ret
  }
}

const PRECACHED = /^(?:[+-]?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[$A-Za-z_]\w*)$/
