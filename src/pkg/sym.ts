import type { Package } from "."
import { TXR_SYM, type Sym, type TxrSym } from "../eval/sym"
import { h } from "../jsx"

declare module "../eval/ty" {
  interface Tys {
    sym: Sym
  }

  interface TyComponents {
    sym: never
  }
}

export const PKG_SYM: Package = {
  id: "nya:sym",
  name: "symbolic computation",
  label: null,
  ty: {
    info: {
      sym: {
        name: "symbolic expression",
        namePlural: "symbolic expressions",
        coerce: {},
        garbage: {
          js: { type: "undef" },
          get glsl(): never {
            throw new Error("Cannot construct symbolic expressions in shaders.")
          },
        },
        get glsl(): never {
          throw new Error("Cannot construct symbolic expressions in shaders.")
        },
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            const txr: TxrSym<unknown> | undefined = TXR_SYM[value.type]
            if (!txr) {
              throw new Error(
                `Symbolic expression type '${value.type}' is not defined.`,
              )
            }

            txr.display(props.cursor, value)
          },
        },
        icon() {
          return h(
            "",
            h(
              "text-[#00786F] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_-_1.5px)] font-['Times_New_Roman'] italic text-[100%]",
                "f",
              ),
            ),
          )
        },
      },
    },
  },
}
