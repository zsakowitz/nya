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
} from "../ty"
import { canCoerce, coerceValGlsl, coerceValJs, unifyLists } from "../ty/coerce"
import { listTy } from "../ty/debug"
import { declareGlsl } from "../ty/decl"
import { TY_INFO } from "../ty/info"

/** A single overload of a `FnDist` function. */
export interface FnDistOverload<Q extends TyName = TyName> {
  params: readonly TyName[]
  type: Q
  js(...args: JsVal[]): Val<Q>
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
 *
 * The `Q` type parameter can be used to declare that a `FnDist` always returns
 * a specific value, which will be enforced in the `ret` parameter to
 * {@linkcode FnDist.add} and properly emitted in return types.
 */
export class FnDist<Q extends TyName = TyName> {
  private o: FnDistOverload<Q>[] = []

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
  add<const T extends readonly TyName[], const R extends Q>(
    params: T,
    ret: R,
    js: (...args: { -readonly [K in keyof T]: JsVal<T[K]> }) => Tys[R],
    glsl: (
      ctx: GlslContext,
      ...args: { -readonly [K in keyof T]: GlslVal<T[K]> }
    ) => string,
  ) {
    this.o.push({ params, type: ret, js, glsl })
    return this
  }

  signature(args: Ty[]): FnDistOverload<Q> {
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

  js1(...args: JsVal[]): JsVal<Q> {
    const overload = this.signature(args)

    return {
      type: overload.type,
      value: overload.js(
        ...args.map((x, i) => coerceValJs(x, overload.params[i]!)),
      ),
    }
  }

  glsl1(ctx: GlslContext, ...args: GlslVal[]): GlslVal<Q> {
    const overload = this.signature(args)

    return {
      type: overload.type,
      expr: overload.glsl(
        ctx,
        ...args.map((x, i) => coerceValGlsl(ctx, x, overload.params[i]!)),
      ),
    }
  }

  js(...args: JsValue[]): JsValue<Q> {
    const overload = this.signature(args)
    const list = unifyLists(args)

    if (list === false) {
      return {
        type: overload.type,
        list,
        value: overload.js(
          ...args.map((x, i) => coerceValJs(x as JsVal, overload.params[i]!)),
        ),
      }
    }

    return {
      type: overload.type,
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

  glsl(ctx: GlslContext, ...args: GlslValue[]): GlslValue<Q> {
    const overload = this.signature(args)
    const list = unifyLists(args)

    if (list === false) {
      return {
        type: overload.type,
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
    ctx.push`${TY_INFO[overload.type].glsl} ${ret}[${list}];\n`

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

    return { type: overload.type, list, expr: ret }
  }

  withName(name: string) {
    const dist = new FnDist<Q>(name)
    dist.o = this.o
    return dist
  }
}

/**
 * `FnDistVar` are like `FnDist`, but will automatically resolve calls with
 * three or more arguments to nested two-argument calls by creating virtual
 * signatures on-the-fly.
 *
 * Calling `FnDistVar(a, b, c, d)` will thus return the value of
 * `FnDist(FnDist(FnDist(a, b), c), d)`.
 */
export class FnDistVar<Q extends TyName = TyName> extends FnDist<Q> {
  signature(args: Ty[]): FnDistOverload<Q> {
    if (args.length <= 2) {
      return super.signature(args)
    }

    let signature = super.signature([args[0]!, args[1]!])

    for (let i = 2; i < args.length; i++) {
      const self = super.signature([signature, args[i]!])
      const prev = signature

      signature = {
        params: [...prev.params, self.params[self.params.length - 1]!],
        type: self.type,
        js(...args) {
          return self.js(
            { type: prev.type, value: prev.js(...args.slice(0, -1)) },
            args[args.length - 1]!,
          )
        },
        glsl(ctx, ...args) {
          return self.glsl(
            ctx,
            { type: prev.type, expr: prev.glsl(ctx, ...args.slice(0, -1)) },
            args[args.length - 1]!,
          )
        },
      }
    }

    return signature
  }
}
