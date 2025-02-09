import { safe } from "../../lib/util"
import type { TyName, Tys } from "../../ty"
import { num } from "../../ty/create"
import { TY_INFO, type TyInfo } from "../../ty/info"
import { FnDist } from "../dist"

export const FN_COMPONENT = new FnDist(
  "component",
  "gets a component of a multidimensional value",
)

for (const [tyRaw, infoRaw] of Object.entries(TY_INFO)) {
  const ty = tyRaw as TyName
  const info = infoRaw as TyInfo<Tys[TyName], TyName>
  const comps = info.components
  if (!comps) continue

  const name =
    info.namePlural.slice(0, 1).toUpperCase() + info.namePlural.slice(1)

  FN_COMPONENT.add(
    [ty, "r32"],
    comps.ty,
    (a, b) => {
      const val = num(b.value) - 1
      let comp
      if (!(safe(val) && (comp = comps.at[val]))) {
        throw new Error(`${name} only have components 1-${comps.at.length}.`)
      }

      return comp[0](a.value)
    },
    (_, a, b) => {
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
  )
}
