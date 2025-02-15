import type { Package } from "."
import { FnList } from "../eval/ops/list"
import { num, real } from "../eval/ty/create"
import { PKG_REAL } from "./num-real"

const min = new FnList("min", "returns the minimum of its inputs").addSpread(
  "r32",
  1,
  "r32",
  (...args) =>
    args.length ?
      args.map((x) => x.value).reduce((a, b) => (num(b) < num(a) ? b : a))
    : real(NaN),
  (_, ...args) =>
    args.length ?
      args.map((x) => x.expr).reduce((a, b) => `min(${a}, ${b})`)
    : `(0.0/0.0)`,
)

const max = new FnList("max", "returns the maximum of its inputs").addSpread(
  "r32",
  1,
  "r32",
  (...args) =>
    args.length ?
      args.map((x) => x.value).reduce((a, b) => (num(b) > num(a) ? b : a))
    : real(NaN),
  (_, ...args) =>
    args.length ?
      args.map((x) => x.expr).reduce((a, b) => `max(${a}, ${b})`)
    : `(0.0/0.0)`,
)

export const PKG_STATISTICS: Package = {
  id: "nya:statistics",
  name: "statistics",
  label: "adds basic statistics functions",
  deps: [() => PKG_REAL],
  eval: {
    fns: {
      min,
      max,
    },
  },
}
