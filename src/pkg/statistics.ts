import type { Package } from "."
import { FnList } from "../eval/ops/list"
import { num } from "../eval/ty/create"

const min = new FnList("min", "returns the minimum of its inputs").addSpread(
  "r32",
  1,
  "r32",
  (...args) =>
    args.map((x) => x.value).reduce((a, b) => (num(b) < num(a) ? b : a)),
  (_, ...args) => args.map((x) => x.expr).reduce((a, b) => `min(${a}, ${b})`),
)

const max = new FnList("max", "returns the maximum of its inputs").addSpread(
  "r32",
  1,
  "r32",
  (...args) =>
    args.map((x) => x.value).reduce((a, b) => (num(b) > num(a) ? b : a)),
  (_, ...args) => args.map((x) => x.expr).reduce((a, b) => `max(${a}, ${b})`),
)

export const PKG_STATISTICS: Package = {
  id: "nya:statistics",
  name: "statistics",
  label: "adds basic statistics functions",
  eval: {
    fns: {
      min,
      max,
    },
  },
}
