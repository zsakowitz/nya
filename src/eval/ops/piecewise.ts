import type { Piece } from "../ast/token"
import { glsl, type PropsGlsl } from "../glsl"
import { js, type PropsJs } from "../js"
import type { GlslValue, JsValue, Val } from "../ty"
import { coerceType, coerceValueGlsl, coerceValueJs } from "../ty/coerce"
import { declareGlsl } from "../ty/decl"
import { garbageValueGlsl, garbageValueJs } from "../ty/garbage"

export function piecewiseJs(piecesRaw: Piece[], props: PropsJs): JsValue {
  const pieces = piecesRaw.map(({ value, condition }, index) => {
    if (index == piecesRaw.length - 1 && condition.type == "void") {
      condition = { type: "var", kind: "var", value: "true" }
    }

    const cond = js(condition, props)
    if (cond.list !== false) {
      throw new Error(
        "Lists cannot be used as the condition for a piecewise function yet.",
      )
    }
    if (cond.type != "bool") {
      throw new Error(
        "The 'if' clause in a piecewise function must be a condition like z = 2.",
      )
    }

    return { value: js(value, props), cond }
  })

  const ret = coerceType(pieces.map((x) => x.value))
  for (const { value, cond } of pieces) {
    if (cond.value) {
      return coerceValueJs(value, ret)
    }
  }

  return {
    type: ret.type,
    list: ret.list as number,
    value: garbageValueJs(ret) as Val[],
  }
}

export function piecewiseGlsl(piecesRaw: Piece[], props: PropsGlsl): GlslValue {
  const name = props.ctx.name()

  let isDefinitelyAssigned = false
  const pieces = piecesRaw.map(({ value, condition }, index) => {
    if (index == piecesRaw.length - 1 && condition.type == "void") {
      isDefinitelyAssigned = true
      condition = { type: "var", kind: "var", value: "true" }
    }

    const ctxCond = props.ctx.fork()
    const cond = glsl(condition, { ...props, ctx: ctxCond })
    if (cond.list !== false) {
      throw new Error(
        "Lists cannot be used as the condition for a piecewise function yet.",
      )
    }
    if (cond.type != "bool") {
      throw new Error(
        "The 'if' clause in a piecewise function must be a condition like z = 2.",
      )
    }

    const ctxValue = props.ctx.fork()
    const val = glsl(value, { ...props, ctx: ctxValue })

    return { ctxCond, ctxValue, value: val, cond }
  })

  const ret = coerceType(pieces.map((x) => x.value))

  props.ctx.push`${declareGlsl(ret, name)};\n`
  let closers = ""
  for (const { ctxCond, cond, ctxValue, value } of pieces) {
    props.ctx.block += ctxCond.block
    props.ctx.push`if (${cond.expr}) {\n`
    props.ctx.block += ctxValue.block
    props.ctx.push`${name} = ${coerceValueGlsl(props.ctx, value, ret)};\n`
    props.ctx.push`} else {\n`
    closers += "}"
  }
  if (!isDefinitelyAssigned) {
    props.ctx.push`${name} = ${garbageValueGlsl(props.ctx, ret)};\n`
  }
  props.ctx.block += closers + "\n"

  return { ...ret, expr: name }
}
