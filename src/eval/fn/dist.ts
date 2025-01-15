import { GlslContext } from "../fn"
import type {
  GlslVal,
  GlslValue,
  JsVal,
  JsValue,
  Ty,
  TyName,
  Tys,
  Val,
} from "../ty2"
import {
  canCoerce,
  coerceValGlsl,
  coerceValJs,
  unifyLists,
} from "../ty2/coerce"
import { listTy } from "../ty2/debug"
import { declareGlsl } from "../ty2/decl"
import { TY_INFO } from "../ty2/info"

/** A single overload of a `FnDist` function. */
export interface FnDistOverload {
  params: readonly TyName[]
  ret: TyName
  js(...args: JsVal[]): Val
  glsl(ctx: GlslContext, ...args: GlslVal[]): string
}

/**
 * `FnDist` are functions which take a fixed number of arguments of
 * predetermined type, and return some value of predetermined type. They
 * distribute across lists, returning a list of the shortest length of their
 * inputs. Overloads are added via the {@linkcode FnDist.add} method.
 *
 * Note that overloads are resolved in the order they are declared, so declare
 * real overloads before complex ones, and 64-bit overloads before 32-bit ones.
 */
export class FnDist {
  private readonly o: FnDistOverload[] = []

  constructor(private readonly name: string) {}

  /**
   * Adds an overload to this function. Note that overloads are preferred in the
   * order they are declared, so order _does_ matter.
   *
   * In particular, if a `c32` or `r32` overload is declared before its
   * corresponding `c64` or `r64` overload, the 64-bit overload will never be
   * used, as the inputs will coerce to `c32` before attempting to match the
   * `c64` overload.
   */
  add<const T extends readonly TyName[], const R extends TyName>(
    params: T,
    ret: R,
    js: (...args: { -readonly [K in keyof T]: JsVal<T[K]> }) => Tys[R],
    glsl: (
      ctx: GlslContext,
      ...args: { -readonly [K in keyof T]: GlslVal<T[K]> }
    ) => string,
  ) {
    this.o.push({ params, ret, js, glsl })
    return this
  }

  signature(args: Ty[]): FnDistOverload {
    outer: for (const overload of this.o) {
      const { params } = overload

      if (args.length != params.length) {
        continue
      }

      for (let i = 0; i < args.length; i++) {
        const arg = args[i]!
        const param = params[i]!
        if (!canCoerce(arg.type, param)) {
          continue outer
        }
      }

      return overload
    }

    throw new Error(
      `Cannot call '${this.name}' with arguments of type ${listTy(args)}.`,
    )
  }

  js1(...args: JsVal[]): JsVal {
    const overload = this.signature(args)

    return {
      type: overload.ret,
      value: overload.js(
        ...args.map((x, i) => coerceValJs(x, overload.params[i]!)),
      ),
    }
  }

  glsl1(ctx: GlslContext, ...args: GlslVal[]): GlslVal {
    const overload = this.signature(args)

    return {
      type: overload.ret,
      expr: overload.glsl(
        ctx,
        ...args.map((x, i) => coerceValGlsl(ctx, x, overload.params[i]!)),
      ),
    }
  }

  js(...args: JsValue[]): JsValue {
    const overload = this.signature(args)
    const list = unifyLists(args)

    if (list === false) {
      return {
        type: overload.ret,
        list,
        value: overload.js(
          ...args.map((x, i) => coerceValJs(x as JsVal, overload.params[i]!)),
        ),
      }
    }

    return {
      type: overload.ret,
      list,
      value: Array.from({ length: list }, (_, j) =>
        overload.js(
          ...args.map((x, i) =>
            coerceValJs(
              x.list === false ? x : { type: x.type, value: x.value[j]! },
              overload.params[i]!,
            ),
          ),
        ),
      ),
    }
  }

  glsl(ctx: GlslContext, ...args: GlslValue[]): GlslValue {
    const overload = this.signature(args)
    const list = unifyLists(args)

    if (list === false) {
      return {
        type: overload.ret,
        list,
        expr: overload.glsl(
          ctx,
          ...args.map((x, i) =>
            coerceValGlsl(ctx, x as GlslVal, overload.params[i]!),
          ),
        ),
      }
    }

    const cached: GlslValue[] = args.map((arg) => {
      const name = ctx.name()
      ctx.push`${declareGlsl(arg, name)} = ${arg.expr};\n`
      return { ...arg, expr: name }
    })

    const ret = ctx.name()
    ctx.push`${TY_INFO[overload.ret].glsl} ${ret}[${list}];\n`

    const idx = ctx.name()
    ctx.push`for (int ${idx} = 0; ${idx} < ${list}; ${idx}++) {\n`
    ctx.push`${ret}[${idx}] = ${overload.glsl(
      ctx,
      ...cached.map((x, i) =>
        coerceValGlsl(
          ctx,
          x.list === false ? x : { type: x.type, expr: `${x.expr}[${idx}]` },
          overload.params[i]!,
        ),
      ),
    )};\n`
    ctx.push`}\n`

    return { type: overload.ret, list, expr: ret }
  }
}
