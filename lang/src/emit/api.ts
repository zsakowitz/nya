import { OP_TEXT, OVERLOADABLE } from "!/ast/kind"
import type { Declarations } from "./decl"
import { bug, issue } from "./error"
import { Id, ident } from "./id"
import type { Lang } from "./props"
import { Fn, Scalar, type FnParam, type Type } from "./type"
import { Value } from "./value"

function validateTypeName(name: string) {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
    bug(`'${name}' is not a valid type name.`)
  }
}

function validateVarName(name: string) {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
    bug(`'${name}' is not a valid variable name.`)
  }
}

const overloadableNames = OVERLOADABLE.map((x) => OP_TEXT[x] ?? "")

function validateFnName(name: string) {
  if (
    !(
      name &&
      (overloadableNames.includes(name) || /^[A-Za-z][A-Za-z0-9]*$/.test(name))
    )
  ) {
    bug(`'${name}' is not a valid function name.`)
  }
}

const hasOwn = Object.prototype.hasOwnProperty.call.bind(
  Object.prototype.hasOwnProperty,
)

export class ScriptingInterface {
  constructor(readonly lib: Declarations) {}

  createVector(
    name: string,
    kind: "float" | "bool" | "int" | "uint" | "symint",
    convertableToScalars = false,
  ) {
    validateTypeName(name)
    const id = ident(name)
    const type = new Scalar(
      name,
      kind == "symint" ? "int" : kind,
      { type: "vec", of: kind, count: 1 },
      (v) => String(v),
      convertableToScalars ?
        (v) => [v]
      : () => bug(`Type '${name}' cannot be used as a set of scalars.`),
      convertableToScalars ?
        ([v]) => v!
      : () => bug(`Type '${name}' cannot be used as a set of scalars.`),
    )
    this.lib.types.setOrThrow(id, type)
    return type
  }

  createOpaque(name: string, declaration: Record<Lang, string | null>) {
    validateTypeName(name)
    const decl = declaration[this.lib.props.lang]
    if (decl == null) {
      const s = new Scalar(
        name,
        "void",
        { type: "void" },
        () => null,
        () => issue(`Cannot use broadcasting operators on '${name}'.`),
        () => issue(`Cannot use broadcasting operators on '${name}'.`),
      )
      this.lib.types.setOrThrow(ident(name), s)
      return s
    }
    if (decl.includes("%%")) {
      const id = new Id(name)
      const emit = id.ident()
      const decl2 = decl.replace(/%%/g, emit)
      this.lib.global(decl2)
      const s = new Scalar(
        name,
        emit,
        { type: "struct", id },
        () => issue(`Opaque type '${name}' cannot be created at compile time.`),
        () => issue(`Cannot use broadcasting operators on '${name}'.`),
        () => issue(`Cannot use broadcasting operators on '${name}'.`),
      )
      this.lib.types.setOrThrow(ident(name), s)
      return s
    }
    const s = new Scalar(
      name,
      decl,
      { type: "struct", id: new Id(name) },
      () => issue(`Opaque type '${name}' cannot be created at compile time.`),
      () => issue(`Cannot use broadcasting operators on '${name}'.`),
      () => issue(`Cannot use broadcasting operators on '${name}'.`),
    )
    this.lib.types.setOrThrow(ident(name), s)
    return s
  }

  fn(
    name: string,
    params: Record<string, Type>,
    ret: Type,
    impls: Record<Lang, ScriptingInterfaceFnImpl>,
  ) {
    validateFnName(name)
    const id = ident(name)

    const fnParams: FnParam[] = []
    for (const name in params) {
      if (!hasOwn(params, name)) continue
      validateVarName(name)
      fnParams.push({ name, type: params[name]! })
    }

    const { sideEffects, globals, texts, args, cacheArgs } =
      impls[this.lib.props.lang]
    const max = texts.length - 1
    if (globals) {
      this.lib.global(globals)
    }

    new Fn(id, fnParams, ret, (values, block) => {
      let text = ""
      if (cacheArgs) {
        values = values.map((x) => block.cache(x, true))
      }
      for (let i = 0; i < max; i++) {
        text += texts[i]!
        text += values[args[i]!]!.toString()
      }
      text += texts[max]!
      if (sideEffects) {
        block.source += text
        return new Value(0, ret)
      } else {
        return new Value(text, ret)
      }
    })
  }
}

export type FnInterp = string | `${string}%%${string}` | number

function f(
  sideEffects: boolean,
  strings: TemplateStringsArray,
  args: FnInterp[],
) {
  let globals = ""
  const texts = [strings[0]!]
  const argIndices: number[] = []
  let cacheArgs = false
  for (let i = 1; i < strings.length; i++) {
    const arg = args[i - 1]!
    const text = strings[i]!

    if (arg == null) {
      texts[texts.length - 1] += text
    } else if (typeof arg == "number") {
      if (argIndices.includes(arg)) {
        cacheArgs = true
      }
      argIndices.push(arg)
      texts.push(text)
    } else if (arg.includes("%%")) {
      const id = new Id(arg).ident()
      if (globals) globals += "\n"
      globals += arg.replaceAll(/%%/g, id)
      texts[texts.length - 1] += id + text
    } else {
      const id = new Id(arg).ident()
      if (globals) globals += "\n"
      globals += `const ${id}=${arg};` // this shortened `const %%=...` form is only allowed in JS
      texts[texts.length - 1] += id + text
    }
  }
  return { sideEffects, globals, texts, args: argIndices, cacheArgs }
}

export function v(strings: TemplateStringsArray, ...args: FnInterp[]) {
  return f(false, strings, args)
}

export function e(strings: TemplateStringsArray, ...args: FnInterp[]) {
  return f(true, strings, args)
}

type ScriptingInterfaceFnImpl = ReturnType<typeof f>

export type Plugin = (api: ScriptingInterface) => void
