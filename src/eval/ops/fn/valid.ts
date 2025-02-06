import { FnDist } from "../dist"
import { num } from "../../ty/create"

export const FN_VALID = new FnDist<"bool">(
  "valid",
  "returns true if a value is valid for the given type (whether a number is finite, whether a color is displayable, etc.)",
)
  .add(
    ["bool"],
    "bool",
    () => true,
    () => "true",
  )
  .add(
    ["r32"],
    "bool",
    (a) => isFinite(num(a.value)),
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `(!isnan(${a}) && !isinf(${a}))`
    },
  )
  .add(
    ["c32"],
    "bool",
    (a) => isFinite(num(a.value.x)) && isFinite(num(a.value.y)),
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `(!isnan(${a}.x) && !isinf(${a}.x) && !isnan(${a}.y) && !isinf(${a}.y))`
    },
  )
  .add(
    ["color"],
    "bool",
    ({ value: c }) => {
      const r = num(c.r)
      const g = num(c.g)
      const b = num(c.b)
      const a = num(c.a)
      return (
        0 <= r &&
        r <= 255 &&
        0 <= g &&
        g <= 255 &&
        0 <= b &&
        b <= 255 &&
        0 <= a &&
        a <= 1
      )
    },
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `(0.0 <= ${a}.x && ${a}.x <= 1.0 && 0.0 <= ${a}.y && ${a}.y <= 1.0 && 0.0 <= ${a}.z && ${a}.z <= 1.0 && 0.0 <= ${a}.w && ${a}.w <= 1.0)`
    },
  )
