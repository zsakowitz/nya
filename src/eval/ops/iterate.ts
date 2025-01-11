import { js, type Iterate, type PropsJs } from "../eval"
import type { JsValue } from "../ty"
import { frac, num } from "../ty/create"

export function iterateJs(data: Iterate, props: PropsJs): JsValue {
  const limitVal = js(data.limit, props)
  if (limitVal.list) {
    throw new Error("'iterate' expressions must have a single limit.")
  }
  if (limitVal.type != "real") {
    throw new Error("'iterate' expressions must have a numeric limit.")
  }
  const limit = num(limitVal.value)
  if (limit > 100) {
    throw new Error("'iterate' expressions have a limit of 100 cycles.")
  }

  let value: JsValue =
    data.initial ?
      js(data.initial, props)
    : { type: "real", list: false, value: frac(0, 1) }

  for (let i = 0; i < limit; i++) {
    const shouldExit = props.bindings.with(data.name, value, (): boolean => {
      if (data.condition) {
        const cond = js(data.condition.value, props)
        if (cond.list) {
          throw new Error(
            `'${data.condition.type} ...' clauses cannot be lists.`,
          )
        }
        if (cond.type != "bool") {
          throw new Error(
            `'${data.condition.type} ...' clauses must be conditions, like |z|≤2.`,
          )
        }
        if ((data.condition.type == "until") == cond.value) {
          return true
        }
      }

      value = js(data.expr, props)

      return false
    })
    if (shouldExit) break
  }

  return value
}
