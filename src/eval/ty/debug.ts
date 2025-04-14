import type { Ty, TyName } from "."
import { TY_INFO } from "./info"
import { list } from "./list"

export function listTy(tys: Ty[], conj?: string) {
  return listTyName(
    tys.map((x) => x.type),
    conj,
  )
}

function listTyName(tys: TyName[], conj?: string) {
  return list(
    tys.map((x) => {
      const { name } = TY_INFO[x]
      return `${/^[aeiou]/i.test(name) ? "an" : "a"} ${name}`
    }),
    conj,
  )
}
