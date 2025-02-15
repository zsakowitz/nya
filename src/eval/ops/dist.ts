import { CmdComma } from "../../field/cmd/leaf/comma"
import { OpRightArrow } from "../../field/cmd/leaf/op"
import { CmdBrack } from "../../field/cmd/math/brack"
import { h } from "../../jsx"
import { GlslContext } from "../lib/fn"
import type { GlslVal, JsVal, Ty, TyName, Tys, Val } from "../ty"
import { canCoerce } from "../ty/coerce"
import { listTy } from "../ty/debug"
import { TY_INFO } from "../ty/info"
import { FnDistManual } from "./dist-manual"
import { ALL_DOCS } from "./docs"

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
export class FnDist<Q extends TyName = TyName> extends FnDistManual<Q> {
  o: FnDistOverload<Q>[] = []
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

    if (this.parent) {
      return this.parent.signature(args)
    } else {
      throw new Error(
        `Cannot call '${this.name}' with arguments of type ${listTy(args)}.`,
      )
    }
  }

  withName(name: string, label: string) {
    const dist = new FnDist<Q>(name, label)
    dist.parent = this
    return dist
  }

  docs(): HTMLSpanElement[] {
    return this.o.map((overload) => doc(overload.params, overload.type))
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

export function docByIcon(
  params: HTMLSpanElement[],
  type: HTMLSpanElement,
  list = false,
) {
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
