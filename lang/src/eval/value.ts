import type { Id } from "./id"

export type Value =
  | { kind: "real"; value: string }
  | { kind: "sym"; sym: Id }
  | { kind: "symstruct"; sym: Id; fields: Value[] }
  | { kind: "anonstruct"; fields: Value[] }
