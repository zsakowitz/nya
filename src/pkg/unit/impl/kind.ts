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
