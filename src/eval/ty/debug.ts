import type { Ty, TyName } from "."
import { list } from "../ty"
import { TY_INFO } from "./info"

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
