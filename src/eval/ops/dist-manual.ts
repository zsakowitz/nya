import { type Fn } from "."
import { GlslContext } from "../lib/fn"
import type { GlslVal, GlslValue, JsVal, JsValue, Ty, TyName, Val } from "../ty"
import { coerceValGlsl, coerceValJs, unifyLists } from "../ty/coerce"
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
 * `FnDist` are functions which take a distribute across lists, returning a list
 * of the shortest length of their inputs.
 *
 * The `Q` type parameter can be used to declare that a `FnDist` always returns
 * a specific value.
 */
export abstract class FnDistManual<Q extends TyName = TyName> implements Fn {
  constructor(
    readonly name: string,
    readonly label: string,
  ) {}

  abstract signature(args: Ty[]): FnDistOverload<Q>

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
}
