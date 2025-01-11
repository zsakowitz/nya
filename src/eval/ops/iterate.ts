import { Bindings } from "../binding"
import { glsl, js, type Iterate, type PropsGlsl, type PropsJs } from "../eval"
import { typeToGlsl, type GlslValue, type JsValue } from "../ty"
import { frac, num } from "../ty/create"
import { safe } from "../util"

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

export function iterateGlsl(data: Iterate, props: PropsGlsl): GlslValue {
  const limitVal = js(data.limit, { ...props, bindings: new Bindings() })
  if (limitVal.list) {
    throw new Error("'iterate' expressions must have a single limit.")
  }
  if (limitVal.type != "real") {
    throw new Error("'iterate' expressions must have a numeric limit.")
  }
  const limit = Math.max(0, Math.floor(num(limitVal.value)))
  if (limit > 100) {
    throw new Error("'iterate' expressions have a limit of 100 cycles.")
  }
  if (!safe(limit)) {
    throw new Error("'iterate' expressions must have a finite limit.")
  }

  const initial: GlslValue =
    data.initial ?
      glsl(data.initial, props)
    : { expr: "0.0", type: "real", list: false }

  const name: GlslValue = {
    expr: `_nya_var_${data.name}`,
    list: initial.list,
    type: initial.type,
  }

  const index = props.ctx.name()

  props.ctx.push`${typeToGlsl(initial)} ${name.expr} = ${initial.expr};\n`
  props.ctx.push`for (int ${index} = 0; ${index} < ${limit}; ${index}++) {\n`
  props.bindings.with(data.name, name, () => {
    const next = glsl(data.expr, props)
    if (next.list != name.list || next.type != name.type) {
      throw new Error(
        "The iteration expression and initial value must be the same type.",
      )
    }
    props.ctx.push`${name.expr} = ${next.expr};\n`
  })
  props.ctx.push`}\n`

  return name
}
