import type { FnSignature } from "@/docs/signature"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdBrack } from "@/field/cmd/math/brack"
import { h } from "@/jsx"
import type { GlslContext } from "../lib/fn"
import type { GlslVal, JsVal, Ty, TyName, Type, Tys } from "../ty"
import { canCoerce } from "../ty/coerce"
import { listTy } from "../ty/debug"
import { TY_INFO } from "../ty/info"
import {
  FnDistManual,
  type FnOverload,
  type FnOverloadVar,
  type FnProps,
} from "./dist-manual"
import { ALL_DOCS } from "./docs"
import { issue } from "./issue"

type FnError = `${string}%%${string}`

export interface FnDistProps extends FnProps {
  message?: FnError
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
  o: FnOverload<Q>[] = []
  private parent?: FnDist<Q>
  private readonly message: FnError

  constructor(name: string, label: string, props?: FnDistProps) {
    super(name, label, props)
    this.message = props?.message ?? `Cannot call '${name}' with %%.`
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
    docOrder: number | null = null,
  ) {
    this.o.push({ params, type: ret, js, glsl, docOrder })
    return this
  }

  /** See {@linkcode FnDist.add} for information. */
  addJs<const T extends readonly TyName[], const R extends Q>(
    params: T,
    ret: R,
    js: (...args: { -readonly [K in keyof T]: JsVal<T[K]> }) => Tys[R],
    docOrder: number | null = null,
  ) {
    this.o.push({
      params,
      type: ret,
      js,
      glsl: issue(
        `The '${this.name}' function cannot be called from shaders yet.`,
      ),
      docOrder,
    })
    return this
  }

  /** Adds a function which can take any number of arguments of a single type. */
  addSpread<T extends TyName, R extends Q>(
    param: T,
    ret: R,
    js: (value: Tys[T][]) => Tys[R],
    glsl: (ctx: GlslContext, ...args: GlslVal<T>[]) => string,
    docOrder: number | null = null,
  ) {
    this.o.push({ param, type: ret, js, glsl, docOrder })
    return this
  }

  signature(args: Ty[]): FnOverload<Q> {
    outer: for (const overload of this.o) {
      if (overload.param != null) {
        if (args.length == 0) {
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
      throw new Error(this.message.replace("%%", listTy(args)))
    }
  }

  trySignatureList(arg: Type<TyName, number>): FnOverloadVar<Q> | null {
    for (const overload of this.o) {
      if (overload.param == null) {
        continue
      }

      if (!canCoerce(arg.type, overload.param)) {
        continue
      }

      return overload
    }

    if (this.parent) {
      return this.parent.trySignatureList(arg)
    } else {
      return null
    }
  }

  signatureList(arg: Type<TyName, number>): FnOverloadVar<Q> {
    const signature = this.trySignatureList(arg)
    if (signature) {
      return signature
    }

    throw new Error(
      this.message.replace("%%", `a list of ${TY_INFO[arg.type].namePlural}`),
    )
  }

  with(name: string, label: string, props?: Partial<FnDistProps>) {
    const dist = new FnDist<Q>(name, label, {
      deriv: this.deriv,
      simplify: this.simplify,
      ...props,
    })
    dist.parent = this
    return dist
  }

  docs(): FnSignature[] {
    return this.o
      .slice()
      .sort((a, b) => (a.docOrder ?? 0) - (b.docOrder ?? 0))
      .map(
        (overload): FnSignature =>
          overload.param == null ?
            {
              params: overload.params.map((x) => ({ type: x, list: false })),
              dots: false,
              ret: { type: overload.type, list: false },
            }
          : {
              params: [{ type: overload.param, list: false }],
              dots: false,
              ret: { type: overload.type, list: false },
            },
      )
  }
}

export function icon(name: TyName) {
  try {
    return TY_INFO[name].icon()
  } catch {
    console.warn("[icon missing]", name)
    return h("", name)
  }
}

function arrayEls(node: Node) {
  return [
    node.cloneNode(true),
    new CmdComma().el,
    node.cloneNode(true),
    new CmdComma().el,
    h("nya-cmd-dot nya-cmd-dot-l", "."),
    h("nya-cmd-dot", "."),
    h("nya-cmd-dot", "."),
  ]
}

export function array(node: Node) {
  return CmdBrack.render("[", "]", null, {
    el: h("", ...arrayEls(node)),
  })
}
