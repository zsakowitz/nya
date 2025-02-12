import type { Package } from "."
import { OP_AND } from "../eval/ops/op/and"
import { OP_OR } from "../eval/ops/op/or"

OP_AND.add(
  ["bool", "bool"],
  "bool",
  (a, b) => a.value && b.value,
  (_, a, b) => `(${a.expr} && ${b.expr})`,
)

OP_OR.add(
  ["bool", "bool"],
  "bool",
  (a, b) => a.value || b.value,
  (_, a, b) => `(${a.expr} || ${b.expr})`,
)

export const PKG_BOOL: Package = {
  id: "nya:bool-ops",
  name: "boolean operations",
  label: "adds support for operations on boolean values",
}
