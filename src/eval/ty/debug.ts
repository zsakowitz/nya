import type { Ty, TyName } from "."
import { list } from "../ty"
import { TY_INFO } from "./info"

export function listTy(tys: Ty[], conj?: string) {
  return listTyName(
    tys.map((x) => x.type),
    conj,
  )
}

export function listTyName(tys: TyName[], conj?: string) {
  return list(
    tys.map((x) => TY_INFO[x].name),
    conj,
  )
}
