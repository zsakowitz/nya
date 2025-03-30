import type { JsValue, TyName } from "@/eval/ty"
import type { Sym, SymVal } from "../sym"
import { TY_INFO } from "../ty/info"
import { FnDist, type FnDistProps } from "./dist"
import type { DerivFn } from "./dist-manual"

/**
 * `FnDistDeriv` are like `FnDist`, but require knowing the type of the first
 * argument in order to compute the derivative.
 */
export class FnDistDeriv extends FnDist {
  private readonly fns: Partial<Record<TyName, DerivFn>> = Object.create(null)

  constructor(
    name: string,
    label: string,
    props?: Omit<FnDistProps, "deriv" | "simplify">,
  ) {
    super(name, label, {
      ...props,
      deriv: (args, wrt) => {
        const a = args[0]!
        switch (a.type) {
          case "undef":
            return { type: "undef" }
          case "var":
          case "call":
            throw new Error(
              `Cannot take derivative of '${name}' if the first argument is a variable; it must be an expression like normaldist() or segment() which explicitly specifies the type.`,
            )
        }

        const f = this.fns[a.value.type]
        if (!f) {
          const hasNonDerivativeOverload = this.o.some((x) =>
            x.param ? x.param == a.value.type : x.params[0] == a.value.type,
          )

          throw new Error(
            hasNonDerivativeOverload ?
              `Unable to take derivative of '${name}' when the first argument is a ${TY_INFO[a.value.type].name}.`
            : `First argument of '${name}' cannot be a ${TY_INFO[a.value.type].name}.`,
          )
        }

        return f(args, wrt)
      },
    })
  }

  addDeriv<K extends TyName>(
    ty: K,
    f: (
      args: [
        (
          | { type: "js"; value: JsValue<K> }
          | { type: "val"; value: Extract<SymVal, { type: K }> }
        ),
        ...Sym[],
      ],
      wrt: string,
    ) => Sym,
  ) {
    this.fns[ty] = f as DerivFn
    return this
  }
}
