import type { GlslContext } from "../lib/fn"
import type { GlslVal, GlslValue, JsVal, JsValue, Ty, TyName } from "../ty"
import { unifyLists } from "../ty/coerce"
import { TY_INFO } from "../ty/info"

export class FnDerived {
  constructor(
    readonly name: string,
    readonly label: string,
    readonly list: boolean,
    readonly fty: (...args: Ty[]) => TyName,
    readonly fjs: (...args: JsVal[]) => JsVal,
    readonly fglsl: (ctx: GlslContext, ...args: GlslVal[]) => GlslVal,
  ) {}

  js(...args: JsValue[]): JsValue {
    if (this.list && args.length == 1 && args[0]!.list !== false) {
      if (args[0]!.list === 0) {
        const type = this.fty(...args)

        return {
          list: false,
          type,
          value: TY_INFO[type].garbage.js,
        }
      }

      return {
        ...this.fjs(
          ...args[0]!.value.map((val) => ({ value: val, type: args[0]!.type })),
        ),
        list: false,
      }
    }

    const list = unifyLists(args)

    if (list === false) {
      return {
        ...this.fjs(...(args as JsVal[])),
        list,
      }
    }

    return {
      type: this.fty(...args),
      list,
      value: Array.from(
        { length: list },
        (_, j) =>
          this.fjs(
            ...args.map((x) =>
              x.list === false ? x : { type: x.type, value: x.value[j]! },
            ),
          ).value,
      ),
    }
  }

  glsl(ctx: GlslContext, ...args: GlslValue[]): GlslValue {
    if (this.list && args.length == 1 && args[0]!.list !== false) {
      if (args[0]!.list === 0) {
        const type = this.fty(...args)

        return {
          list: false,
          type,
          expr: TY_INFO[type].garbage.glsl,
        }
      }

      const name = ctx.name()
      ctx.push`${TY_INFO[args[0]!.type].glsl} ${name}[${args[0]!.list}] = ${args[0]!.expr};\n`
      return {
        ...this.fglsl(
          ctx,
          ...Array.from({ length: args[0]!.list }, (_, i) => ({
            type: args[0]!.type,
            expr: `${name}[${i}]`,
          })),
        ),
        list: false,
      }
    }

    const list = unifyLists(args)

    if (list === false) {
      return {
        ...this.fglsl(ctx, ...(args as GlslVal[])),
        list,
      }
    }

    throw new Error(
      "FnDerived are not available in shaders with mixed list arguments.",
    )
    // return {
    //   type: this.fty(...args),
    //   list,
    //   expr: Array.from(
    //     { length: list },
    //     (_, j) =>
    //       this.fglsl(
    //         ...args.map((x) =>
    //           x.list === false ? x : { type: x.type, value: x.value[j]! },
    //         ),
    //       ).expr,
    //   ),
    // }
  }
}
