import { OP_TEXT, OVERLOADABLE } from "!/ast/kind"
import { AnyVector } from "./broadcast"
import type { Block, Declarations } from "./decl"
import { bug, issue } from "./error"
import { Id, ident } from "./id"
import type { EmitProps, Lang } from "./props"
import type { GlslScalar, ReprVec } from "./repr"
import { Fn, Scalar, type FnParam, type FnType, type Type } from "./type"
import { Value } from "./value"

const NAME = /^[A-Za-z]\w*$/
const NAME_FN = /^@?[A-Za-z]\w*$/

function validateTypeName(name: string) {
  if (!NAME.test(name)) {
    bug(`'${name}' is not a valid type name.`)
  }
}

function validateVarName(name: string) {
  if (!NAME.test(name)) {
    bug(`'${name}' is not a valid variable name.`)
  }
}

const overloadableNames = OVERLOADABLE.map((x) => OP_TEXT[x] ?? "")

function validateFnName(name: string) {
  if (
    !(
      name &&
      ((name[0] == "@" ?
        overloadableNames.includes(name.slice(1))
      : overloadableNames.includes(name)) ||
        NAME_FN.test(name))
    )
  ) {
    bug(`'${name}' is not a valid function name.`)
  }
}

const hasOwn = Object.prototype.hasOwnProperty.call.bind(
  Object.prototype.hasOwnProperty,
)

export class NyaApi {
  constructor(readonly lib: Declarations) {}

  scalar(
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
      kind == "float" ?
        (v) =>
          v === Infinity ? `(1./0.)`
          : v === -Infinity ? `(-1./0.)`
          : v !== v ? `(0./0.)`
          : /[.e]/.test("" + v) ? "" + v
          : v + "."
      : (v) => String(v),
      convertableToScalars ?
        (v) => [v]
      : () => bug(`Type '${name}' cannot be used as a set of scalars.`),
      convertableToScalars ?
        (v) => v.pop()!
      : () => bug(`Type '${name}' cannot be used as a set of scalars.`),
    )
    this.lib.types.setOrThrow(id, type)
    return type
  }

  // vec(
  //   name: string,
  //   kind: "float" | "bool" | "int" | "uint" | "symint",
  //   count: 2 | 3 | 4,
  // ) {
  //   validateTypeName(name)
  //   const id = ident(name)
  //   const repr: ReprVec = { type: "vec", of: kind, count }
  //   const vecName = emitGlslVec(repr)
  //   const type = new Scalar(
  //     name,
  //     kind == "symint" ? "int" : kind,
  //     repr,
  //     kind == "float" ?
  //       (v) =>
  //         `${vecName}(${(v as number[])
  //           .map((v) =>
  //             v === Infinity ? `(1./0.)`
  //             : v === -Infinity ? `(-1./0.)`
  //             : v !== v ? `(0./0.)`
  //             : /[.e]/.test("" + v) ? "" + v
  //             : v + ".",
  //           )
  //           .join(",")})`
  //     : (v) =>
  //         `${vecName}(${(v as unknown[]).map((x) => String(x)).join(",")})`,
  //     () => bug(`Type '${name}' cannot be used as a set of scalars.`),
  //     () => bug(`Type '${name}' cannot be used as a set of scalars.`),
  //   )
  //   this.lib.types.setOrThrow(id, type)
  //   return type
  // }

  opaque(name: string, declaration: Record<Lang, string | null>) {
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

  private _fText(
    impl: ScriptingInterfaceFnImpl,
    values: readonly string[],
    block: Block,
    ret: Type,
  ): Value {
    const { sideEffects, globals, texts, args: params } = impl
    const max = texts.length - 1

    if (globals) {
      this.lib.global(globals)
    }
    let text = ""
    for (let i = 0; i < max; i++) {
      text += texts[i]!
      text += values[params[i]!]!
    }
    text += texts[max]!
    if (sideEffects) {
      if (!block) {
        bug(
          `Tried to call side-effecting function implementation but no output block was provided.`,
        )
      }
      block.source += text
      return new Value(0, ret, true)
    } else {
      return new Value(text, ret, false)
    }
  }

  private _f(
    impl: ScriptingInterfaceFnImpl,
    values: Value[],
    block: Block,
    ret: Type,
  ): Value {
    return this._fText(
      impl,
      impl.cacheArgs ?
        values.map((x) => block.cache(x, true).toString())
      : values.map((x) => x.toString()),
      block,
      ret,
    )
  }

  /**
   * Declares a function.
   *
   * @param name The name of the function; must match `/^[A-Za-z]\w*$/`.
   * @param params The parameters to the function; key order is used as argument
   *   order.
   * @param ret The return type of the function. Implementation should take
   *   GREAT care to properly match the type to avoid vulnerabilities or runtime
   *   errors.
   * @param impl The implementation of the function, generated by `v` or `e`.
   */
  f1(
    name: string,
    params: Record<string, FnType>,
    ret: Type,
    impl: ScriptingInterfaceFnImpl | null,
    implConst: ScriptingInterfaceFnImpl | null = impl,
  ) {
    validateFnName(name)
    const id = ident(name)

    const fnParams: FnParam[] = []
    for (const name in params) {
      if (!hasOwn(params, name)) continue
      validateVarName(name)
      fnParams.push({ name, type: params[name]! })
    }

    if (impl == null) {
      // `implConst` is ignored if there is no base impl
      if (ret.repr.type == "void") {
        const f = new Fn(id, fnParams, ret, () => new Value(0, ret, true))
        this.lib.fns.push(id, f)
        return
      } else {
        bug(
          `'${name}' has a void implementation but returns non-void type '${ret}'.`,
        )
      }
    }

    let fConst
    if (implConst) {
      const source = `${implConst.globals}
;(function(${
        (implConst.args.length == 0) == null ?
          ""
        : Array.from(
            { length: Math.max(...implConst.args) + 1 },
            (_, i) => "$" + i,
          ).join(",")
      }){${
        implConst.sideEffects || ret.repr.type == "void" ? "" : "return "
      }${implConst.texts
        .map((x, i, a) =>
          i == a.length - 1 ? x : x + `$` + implConst.args[i]!,
        )
        .join("")}})`
      fConst = (0, eval)(source) as (...args: any[]) => any
    }

    const f = new Fn(id, fnParams, ret, (values, block) => {
      if (implConst && values.every((x) => x.const())) {
        const val = fConst!(...values.map((x) => x.value))
        return new Value(val, ret, true)
      }
      return this._f(impl, values, block, ret)
    })

    this.lib.fns.push(id, f)
  }

  /**
   * Identical to `.f1()`, but takes an object containing language-dependent
   * implementations instead of a single implementation, then decides based on
   * the language of the underlying {@linkcode EmitProps}.
   *
   * See `.f1()` for documentation.
   */
  fn(
    name: string,
    params: Record<string, FnType>,
    ret: Type,
    impls: Record<Lang, ScriptingInterfaceFnImpl | null>,
    addConstTimeImpl = true,
  ) {
    this.f1(
      name,
      params,
      ret,
      impls[this.lib.props.lang],
      addConstTimeImpl ? impls.js : null,
    )
  }

  /**
   * Creates a broadcasting function like + or clamp(), which broadcast across
   * vectors.
   */
  fb(
    name: string,
    params: Record<string, GlslScalar | FnType>,
    ret: GlslScalar,
    allowSingleValues: boolean,
    impls: { js1: ScriptingInterfaceFnImpl; glslN: ScriptingInterfaceFnImpl },
  ) {
    validateFnName(name)
    const id = ident(name)

    const fnParams: FnParam[] = []
    const broadcast = new Set<number>()
    let i = 0
    for (const name in params) {
      if (!hasOwn(params, name)) continue
      validateVarName(name)
      const raw = params[name]!
      const type =
        typeof raw == "string" ? (broadcast.add(i), new AnyVector(raw)) : raw
      fnParams.push({ name, type })
      i++
    }

    if (broadcast.size == 0) {
      bug(
        `Broadcasting function '${name}' does not take any broadcastable arguments.`,
      )
    }

    const fn = new Fn(
      id,
      fnParams,
      new AnyVector(ret),
      (args, block, _, pos) => {
        const v: Value[] = args.map((x) => block.cache(x, true))
        let retType: Type | undefined
        let backupType: Type | undefined
        for (let i = 0; i < args.length; i++) {
          const arg = args[i]!
          if (broadcast.has(i)) {
            if (allowSingleValues && (arg.type.repr as ReprVec).count == 1) {
              backupType ??= arg.type
            } else if (retType == null) {
              retType = arg.type
            } else if (retType != arg.type) {
              issue(
                `Broadcasted arguments to '${name}' must all be of the same type.`,
                pos,
              )
            }
          }
        }
        retType ??= backupType
        if (!retType) {
          issue(`At least one argument to '${name}' must be a non-scalar.`, pos)
        }

        if (this.lib.props.lang == "glsl") {
          return this._f(impls.glslN, v, block, retType)
        } else {
          const vals = v.map((x, i) =>
            broadcast.has(i) ? retType.toScalars(x) : x,
          )
          return retType.fromScalars(
            Array.from({ length: (retType.repr as ReprVec).count }, (_, i) =>
              this._f(
                impls.js1,
                vals.map((x) => (Array.isArray(x) ? x[i]! : x)),
                block,
                this.lib.tyNum,
              ),
            ),
          )
        }
      },
    )
    this.lib.fns.push(id, fn)
  }

  /**
   * Creates a debroadcasting function like norm() and length(), which condense
   * many values into one.
   */
  fu(
    name: string,
    params: Record<string, GlslScalar | FnType>,
    ret: Type,
    impls: {
      glsl: ScriptingInterfaceFnImpl
      js2: ScriptingInterfaceFnImpl
      js3: ScriptingInterfaceFnImpl
      js4: ScriptingInterfaceFnImpl
    },
  ) {
    validateFnName(name)
    const id = ident(name)

    const fnParams: FnParam[] = []
    const broadcast = new Set<number>()
    let i = 0
    for (const name in params) {
      if (!hasOwn(params, name)) continue
      validateVarName(name)
      const raw = params[name]!
      const type =
        typeof raw == "string" ? (broadcast.add(i), new AnyVector(raw)) : raw
      fnParams.push({ name, type })
      i++
    }

    if (broadcast.size == 0) {
      bug(
        `Broadcasting function '${name}' does not take any broadcastable arguments.`,
      )
    }

    const fn = new Fn(id, fnParams, ret, (args, block) => {
      const v: Value[] = args.map((x) => block.cache(x, true))
      let vecType: Type | undefined
      for (let i = 0; i < args.length; i++) {
        const arg = args[i]!
        if (broadcast.has(i)) {
          const s = arg.type.repr as ReprVec
          if (s.count != 1) {
            if (vecType == null) {
              vecType = arg.type
            } else if (vecType != arg.type) {
              issue(
                `Multi-value arguments to '${name}' must all be of the same type.`,
              )
            }
          }
        }
      }

      if (vecType == null) {
        issue(
          `'${name}' should be called with at least one multi-value struct.`,
        )
      }

      if (this.lib.props.lang == "glsl") {
        return this._f(impls.glsl, v, block, ret)
      }

      const impl = impls[`js${(vecType.repr as ReprVec).count as 2 | 3 | 4}`]
      return this._fText(
        impl,
        v.map((x, i) =>
          broadcast.has(i) ? x.toScalars().join(`),(`) : x.toString(),
        ),
        block,
        ret,
      )
    })
    this.lib.fns.push(id, fn)
  }
}

export type FnInterp = string | `${string}%%${string}` | 0 | 1 | 2 | 3

function f(
  sideEffects: boolean,
  strings: TemplateStringsArray,
  args: FnInterp[],
  globals = "",
) {
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
      texts[texts.length - 1] += "("
      argIndices.push(arg)
      texts.push(")" + text)
    } else if (arg.includes("%%")) {
      const id = new Id(arg).ident()
      if (globals) globals += "\n"
      globals += arg.replaceAll(/%%/g, id)
      texts[texts.length - 1] += id + text
    } else {
      texts[texts.length - 1] += arg + text
    }
  }
  return { sideEffects, globals, texts, args: argIndices, cacheArgs }
}

/**
 * Constructs function implementations for JS-lang functions in nyalang.
 *
 * Interpolations may be used:
 *
 * - An interpolated number `X` inserts the Xth argument at that position; the
 *   argument is automatically wrapped in parentheses.
 * - An interpolated string inserts that string into the expression unwrapped
 *   (without quotes). Except:
 * - An interpolated string with `%%` replaces with `%%` with an autogenerated
 *   identifier, adds the result as a global declaration, then replaces the
 *   entire interpolation with that same identifier.
 *
 * @example
 *   v`2+3` // the function will return `2+3`
 *   v`${0}+4` // the function will return the 0th argument plus 4
 *   v`${0}*${1}` // the function will return the 0th argument times the 1st argument
 *   v`${"const %%=Math.floor"}(${0},${1})` // compiles to something like `_1b(${0},${1})` and adds `const _1b=Math.floor` as a global dependency
 */
export function v(strings: TemplateStringsArray, ...args: FnInterp[]) {
  return f(false, strings, args)
}

/**
 * Behaves like {@linkcode v}, but operates as a side effect instead of a
 * value-returning expression.
 *
 * @example
 *   e`console.log(${0})` // logs the 0th argument
 */
export function e(strings: TemplateStringsArray, ...args: FnInterp[]) {
  return f(true, strings, args)
}

export class Impl {
  constructor(private readonly sideEffects = false) {}

  private globals = ""

  cache(text: string) {
    const id = new Id(text).ident()
    this.globals =
      (this.globals ? this.globals + "\n" : "") + text.replace(/%%/g, id)
    return id
  }

  of(strings: TemplateStringsArray, ...args: FnInterp[]) {
    return f(this.sideEffects, strings, args, this.globals)
  }
}

type ScriptingInterfaceFnImpl = ReturnType<typeof f>

export type Plugin = (api: NyaApi) => void
