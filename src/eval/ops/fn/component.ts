import { safe } from "../../lib/util"
import type { Ty, TyName } from "../../ty"
import { canCoerce, coerceValJs } from "../../ty/coerce"
import { num } from "../../ty/create"
import { TY_INFO } from "../../ty/info"
import { docByIcon } from "../dist"
import { FnDistCaching, type FnDistOverload } from "../dist-manual"
import { ALL_DOCS } from "../docs"

export const FN_COMPONENT = new (class extends FnDistCaching {
  constructor() {
    super("component", "gets a component of a multidimensional value")
    ALL_DOCS.push(this)
  }

  gen(args: Ty[]): FnDistOverload<TyName> {
    if (args.length != 2) {
      throw new Error("'component' expects two parameters.")
    }
    if (!canCoerce(args[1]!.type, "r32")) {
      throw new Error(
        "The second parameter to 'component' must be a real number.",
      )
    }

    const ty = args[0]!.type
    const info = TY_INFO[ty]
    const comps = info.components
    const name =
      info.namePlural.slice(0, 1).toUpperCase() + info.namePlural.slice(1)

    if (!comps) {
      throw new Error(`${name} do not have components.`)
    }

    return {
      params: [ty, args[1]!.type],
      type: comps.ty,
      js(a, b) {
        const val = num(coerceValJs(b, "r32").value) - 1
        let comp
        if (!(safe(val) && (comp = comps.at[val]))) {
          throw new Error(`${name} only have components 1-${comps.at.length}.`)
        }

        return comp[0](a.value as never)
      },
      glsl(_, a, b) {
        const STATIC_INDEX =
          /^(?:vec2\(([0-9e+-.]+), ?([0-9e+-.]+)\)\.x|(\d*.\d+|\d+.))$/
        const match = STATIC_INDEX.exec(b.expr)

        let staticIndex: number | null = null
        if (match) {
          if (match[1]) {
            const real = +match[1]
            const imag = +match[2]!
            if (imag == 0) {
              staticIndex = real
            }
          } else {
            staticIndex = +match[3]!
          }
        }

        if (staticIndex == null) {
          throw new Error(
            "The 'component' function's second argument must be a plain number in shaders; try 1 or 2 instead of computing a value.",
          )
        }

        staticIndex--

        if (
          !(
            safe(staticIndex) &&
            0 <= staticIndex &&
            staticIndex < comps.at.length
          )
        ) {
          throw new Error(`${name} only have components 1-${comps.at.length}.`)
        }

        return comps.at[staticIndex]![1](a.expr)
      },
    }
  }

  docs() {
    return Object.entries(TY_INFO)
      .filter((x) => x[1].components != null)
      .map(([_, info]) =>
        docByIcon(
          [info.icon(), TY_INFO.r32.icon()],
          TY_INFO[info.components!.ty].icon(),
        ),
      )
  }
})()
