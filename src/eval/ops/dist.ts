import { CmdComma } from "../../field/cmd/leaf/comma"
import { OpRightArrow } from "../../field/cmd/leaf/op"
import { CmdBrack } from "../../field/cmd/math/brack"
import { h } from "../../jsx"
import { GlslContext } from "../lib/fn"
import type { GlslVal, JsVal, Ty, TyName, Type, Tys } from "../ty"
import { canCoerce } from "../ty/coerce"
import { listTy } from "../ty/debug"
import { TY_INFO } from "../ty/info"
import {
  FnDistManual,
  type FnOverload,
  type FnOverloadVar,
} from "./dist-manual"
import { ALL_DOCS } from "./docs"

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
export class FnDist<Q extends TyName = TyName> extends FnDistManual<Q> {
  o: FnOverload<Q>[] = []
  private parent?: FnDist<Q>

  constructor(name: string, label: string) {
    super(name, label)
    ALL_DOCS.push(this)
  }

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

  /** Adds a function which can take any number of arguments of a single type. */
  addSpread<T extends TyName, R extends Q>(
    param: T,
    min: number,
    ret: R,
    js: (...args: JsVal<T>[]) => Tys[R],
    glsl: (ctx: GlslContext, ...args: GlslVal<T>[]) => string,
  ) {
    this.o.push({ param, min, type: ret, js, glsl })
    return this
  }

  signature(args: Ty[]): FnOverload<Q> {
    outer: for (const overload of this.o) {
      if (overload.param != null) {
        if (args.length < overload.min) {
          continue
        }

        for (let i = 0; i < args.length; i++) {
          const arg = args[i]!
          if (!canCoerce(arg.type, overload.param)) {
            continue outer
          }
        }

        return overload
      }

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

    if (this.parent) {
      return this.parent.signature(args)
    } else {
      throw new Error(
        `Cannot call '${this.name}' with arguments of type ${listTy(args)}.`,
      )
    }
  }

  signatureList(arg: Type<TyName, number>): FnOverloadVar<Q> {
    for (const overload of this.o) {
      if (overload.param == null || arg.list < overload.min) {
        continue
      }

      if (!canCoerce(arg.type, overload.param)) {
        continue
      }

      return overload
    }

    if (this.parent) {
      return this.parent.signatureList(arg)
    } else {
      throw new Error(
        `Cannot call '${this.name}' with a list of ${TY_INFO[arg.type].namePlural}.`,
      )
    }
  }

  withName(name: string, label: string) {
    const dist = new FnDist<Q>(name, label)
    dist.parent = this
    return dist
  }

  docs(): HTMLSpanElement[] {
    return this.o.map((overload) =>
      overload.param == null ?
        doc(overload.params, overload.type)
      : docList(overload.param, overload.min, overload.type),
    )
  }
}

export function icon(name: TyName) {
  try {
    return TY_INFO[name].icon()
  } catch {
    console.error("[icon missing]", name)
    return h("", name)
  }
}

export function doc(params: readonly TyName[], type: TyName, list = false) {
  return docByIcon(params.map(icon), icon(type), list)
}

export function docList(
  param: TyName,
  min: number,
  type: TyName,
  list = false,
) {
  const pm = icon(param)
  return docByIcon(
    [
      ...Array.from({ length: Math.max(min, 2) }, () => [
        pm.cloneNode(true),
        new CmdComma().el,
      ]).flat(),
      h("nya-cmd-dot nya-cmd-dot-l", "."),
      h("nya-cmd-dot", "."),
      h("nya-cmd-dot", "."),
    ],
    icon(type),
    list,
  )
}

export function docByIcon(params: Node[], type: Node, list = false) {
  const brack = CmdBrack.render("(", ")", null, {
    el: h("", ...params.flatMap((x) => [new CmdComma().el, x]).slice(1)),
  })
  return h(
    "font-['Symbola'] text-[1.265rem]",
    brack,
    new OpRightArrow().el,
    list ?
      CmdBrack.render("[", "]", null, {
        el: h(
          "",
          type.cloneNode(true),
          new CmdComma().el,
          type,
          new CmdComma().el,
          h("nya-cmd-dot nya-cmd-dot-l", "."),
          h("nya-cmd-dot", "."),
          h("nya-cmd-dot", "."),
        ),
      })
    : type,
  )
}
