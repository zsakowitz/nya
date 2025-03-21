import { unit, type Unit } from "./system"

export const UNIT_KINDS = ["kg", "m", "s", "A", "K", "mol", "cd"] as const
export type UnitKind = (typeof UNIT_KINDS)[number]

export const UNIT_KIND_NAMES: Record<UnitKind, string> = {
  kg: "mass",
  m: "length",
  s: "time",
  A: "amperage",
  K: "temperature",
  mol: "amount of substance",
  cd: "luminosity",
}

export const UNIT_KIND_VALUES: Record<UnitKind, Unit> = {
  // @ts-expect-error ts doesn't recognize __proto__
  __proto__: null,
  m: unit("m", "m"),
  kg: unit("kg", "kg"),
  s: unit("s", "s"),
  K: unit("K", "K"),
  A: unit("A", "A"),
  mol: unit("mol", "mol"),
  cd: unit("cd", "cd"),
}
