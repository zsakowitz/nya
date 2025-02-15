import type { GlslContext } from "../lib/fn"
import type { GlslValue, JsValue, TyName, Type } from "../ty"
import { coerceValGlsl, coerceValJs } from "../ty/coerce"
import { TY_INFO } from "../ty/info"
import { FnDist } from "./dist"

/**
 * A `FnList` is a function which normally operates on lists. It extends the
 * `FnDist` logic to spread the contents of a single list.
 *
 * The `min` parameter is not respected; zero-length lists may be passed to
 * functions.
 */
export class FnList<Q extends TyName = TyName> extends FnDist<Q> {
  js(...args: JsValue[]): JsValue<Q> {
    if (!(args.length == 1 && args[0]!.list !== false)) {
      return super.js(...args)
    }

    const arg = args[0]!
    const overload = this.signatureList(arg)

    return {
      type: overload.type,
      list: false,
      value: overload.js(
        ...arg.value.map((x) =>
          coerceValJs({ type: arg.type, value: x }, overload.param),
        ),
      ),
    }
  }

  glsl(ctx: GlslContext, ...args: GlslValue[]): GlslValue<Q> {
    if (!(args.length == 1)) {
      return super.glsl(ctx, ...args)
    }

    const arg = args[0]!
    if (arg.list === false) {
      return super.glsl(ctx, ...args)
    }

    const overload = this.signatureList(arg satisfies Type as any)

    const name = ctx.name()
    ctx.push`${TY_INFO[overload.type].glsl} ${name}[${arg.list}] = ${arg.expr};\n`

    return {
      type: overload.type,
      list: false,
      expr: overload.glsl(
        ctx,
        ...Array.from({ length: arg.list }, (_, i) =>
          coerceValGlsl(
            ctx,
            {
              type: arg.type,
              expr: `${name}[${i}]`,
            },
            overload.param,
          ),
        ),
      ),
    }
  }
}
