import type { MagicVar, Node } from "../ast/token"
import {
  Bindings,
  id,
  name,
  parseBindings,
  parseUpdateVar,
  tryParseBindingVar,
  type Binding,
} from "../binding"
import { glsl, js, type PropsGlsl, type PropsJs } from "../eval"
import { list, varDeclToGlsl, type GlslValue, type JsValue } from "../ty"
import { num } from "../ty/create"

export interface IterateVar {
  id: string
  name: string
  update: Node
  from: Node | undefined
}

export interface IterateCondition {
  type: "while" | "until"
  value: Node
}

export type IterateRetval = "count" | { id: string; name: string }

export interface Iterate {
  update: Binding[]
  from: Binding[]

  limit: Node
  condition: IterateCondition | undefined
  retval: IterateRetval | undefined
}

type ValueOrList =
  | { type: "list"; values: Binding[] }
  | { type: "value"; value: Node }

function parseFrom(value: Node): ValueOrList {
  const values = parseBindings(value, tryParseBindingVar)
  if (values.length) {
    if (values.every((x) => x != null)) {
      return { type: "list", values }
    }
    if (values.some((x) => x != null)) {
      throw new Error("A 'from' clause cannot be a mix of values and bindings.")
    }
  }
  return { type: "value", value }
}

export interface ParseIterateProps {
  source: "expr" | "with" | "withseq"
}

export function isIterate(
  op: Node,
): op is Extract<typeof op, { type: "magicvar" }> & { value: "iterate" } {
  return op.type == "magicvar" && op.value == "iterate"
}

export function parseIterate(
  { contents, prop, sub, sup }: MagicVar,
  props: ParseIterateProps,
): Iterate {
  if (sub && (!prop || prop == "count")) {
    throw new Error(
      "Specify the limit of an 'iterate' expression with a superscript (try iterate⁵⁰).",
    )
  }

  if (!sup) {
    throw new Error("'iterate' expressions need a limit (try iterate⁵⁰).")
  }

  let condition: IterateCondition | undefined
  let from: ValueOrList | undefined

  loop: while (contents.type == "op" && contents.b) {
    switch (contents.kind) {
      case "while":
      case "until":
        if (condition) {
          throw new Error(
            "'iterate' expressions can only have one 'while' or 'until' clause.",
          )
        }
        condition = { type: contents.kind, value: contents.b }
        contents = contents.a
        continue
      case "from":
        if (from) {
          throw new Error(
            "'iterate' expressions can only have one 'from' clause. If you want to specify multiply variables, separate them with commas (from a=2, b=3).",
          )
        }
        from = parseFrom(contents.b)
        if (from.type == "list") {
          const ids = Object.create(null)
          for (const [id, _, name] of from.values) {
            if (id in ids) {
              throw new Error(
                `Variable ${name} is specified twice in 'from' clause.`,
              )
            }
            ids[id] = true
          }
        }
        contents = contents.a
        continue
      case "for":
      case "with":
      case "withseq":
      case "base":
        throw new Error(
          `Specify a '${contents.kind}' clause after an 'iterate' expression by wrapping the whole iterate clause in parentheses, then specifying the '${contents.kind}' on the whole thing, like in ‘(iterate⁴ n->n+a) ${contents.kind} ...’.`,
        )
      case "\\to ":
        break loop
      default:
        throw new Error(
          "'iterate' expressions need an update expressions (try iterate⁵⁰ z->z+2).",
        )
    }
  }

  const bindings = parseBindings(contents, parseUpdateVar)

  if (bindings.length == 0) {
    throw new Error("An 'iterate' expression cannot be empty.")
  }

  const ids = Object.create(null)
  for (const [id, _, name] of bindings) {
    if (props.source != "withseq" && id in ids) {
      throw new Error(
        `Cannot update ${name} twice. Maybe you meant 'withseq iterate'?`,
      )
    }
    ids[id] = true
  }

  if (from?.type == "list") {
    for (const [id, _, name] of from.values) {
      if (!(id in ids)) {
        throw new Error(
          `Variable ${name} in 'from' clause must be updated in 'iterate' clause.`,
        )
      }
    }
  }

  let retval: IterateRetval | undefined
  if (props.source == "expr") {
    if (prop == "count") {
      retval = "count"
    } else if (prop) {
      const retId = id({ value: prop, sub })
      const retName = name({ value: prop, sub })
      if (!(retId in ids)) {
        throw new Error(
          `Variable ${retName} returned from 'iterate' clause is not defined in 'iterate' clause.`,
        )
      }
      retval = { id: retId, name: retName }
    } else if (bindings.length == 1) {
      retval = { id: bindings[0]![0], name: bindings[0]![2] }
    } else {
      throw new Error(
        `Write ${list(
          bindings.map((x) => `'iterate.${x[2]}'`),
          "or",
        )} to pick a variable to output, or use a 'with iterate' clause to get access to ${bindings.length == 2 ? "both" : "all of them"}.`,
      )
    }
  } else if (prop) {
    throw new Error(
      `Cannot pick a specific variable to return from a '${props.source} iterate' clause; all variables are made available to the left of the '${props.source}' word.`,
    )
  }

  const iterate: Iterate = {
    condition,
    limit: sup,
    retval,
    update: bindings,
    from: bindings.map(([id, , name]) => [
      id,
      (from &&
        (from.type == "value" ?
          from.value
        : from.values.find((x) => x[0] == id)?.[1])) || {
        type: "num",
        value: "0",
      },
      name,
    ]),
  }

  return iterate
}

export interface DoIterateProps<T> {
  /**
   * Whether to evaluate updates in sequence. Defaults to `false`, for parallel
   * updates.
   */
  seq: boolean
  eval: T
}

function getLimit(node: Node, props: PropsJs): number {
  const value = js(node, props)
  if (value.list) {
    throw new Error("Limit of 'iterate' must be a single number.")
  }
  if (value.type != "real") {
    throw new Error("Limit of 'iterate' must be a number.")
  }
  const real = Math.floor(num(value.value))
  if (!(0 <= real && real <= 100)) {
    throw new Error("Limit of 'iterate' must be between 0 and 100.")
  }

  return real
}

function jsShouldBreak(
  condition: IterateCondition | undefined,
  props: DoIterateProps<PropsJs>,
): boolean {
  if (!condition) {
    return false
  }

  const val = js(condition.value, props.eval)
  if (val.list) {
    throw new Error(
      `The condition of a '${condition.type}' clause cannot be a list yet.`,
    )
  }
  if (val.type != "bool") {
    throw new Error(
      `A '${condition.type}' clause must contain a condition like x<2 or |y|=3.`,
    )
  }

  return (condition.type == "until") == val.value
}

export function iterateJs(
  iterate: Iterate,
  props: DoIterateProps<PropsJs>,
): { data: Record<string, JsValue>; count: number } {
  const limit = getLimit(iterate.limit, props.eval)

  const values: Record<string, JsValue> = Object.create(null)
  for (const [id, from] of iterate.from) {
    values[id] = js(from, props.eval)
  }

  let i = 0
  for (; i < limit; i++) {
    if (jsShouldBreak(iterate.condition, props)) {
      break
    }

    if (props.seq) {
      for (const [id, update] of iterate.update) {
        values[id] = props.eval.bindings.withAll(values, () =>
          js(update, props.eval),
        )
      }
    } else {
      props.eval.bindings.withAll(values, () => {
        for (const [id, update] of iterate.update) {
          values[id] = js(update, props.eval)
        }
      })
    }
  }

  return { data: values, count: i }
}

function glslShouldBreak(
  condition: IterateCondition,
  props: DoIterateProps<PropsGlsl>,
): string {
  const val = glsl(condition.value, props.eval)
  if (val.list !== false) {
    throw new Error(
      `The condition of a '${condition.type}' clause cannot be a list yet.`,
    )
  }
  if (val.type != "bool") {
    throw new Error(
      `A '${condition.type}' clause must contain a condition like x<2 or |y|=3.`,
    )
  }

  return (condition.type == "while" ? "!" : "") + val.expr
}

export function iterateGlsl(
  iterate: Iterate,
  props: DoIterateProps<PropsGlsl>,
): { data: Record<string, GlslValue>; count: GlslValue } {
  const limit = getLimit(iterate.limit, {
    ...props.eval,
    bindings: new Bindings(),
  })
  const { ctx } = props.eval

  const values: Record<string, GlslValue> = Object.create(null)
  for (const [id, from] of iterate.from) {
    const value = glsl(from, props.eval)
    const name = ctx.name()
    ctx.push`${varDeclToGlsl(value, name)} = ${value.expr};\n`
    values[id] = { ...value, expr: name }
  }

  const count: GlslValue = { type: "real", expr: ctx.name(), list: false }
  ctx.push`float ${count.expr};\n`
  const index = ctx.name()
  ctx.push`for (int ${index} = 0; ${index} < ${limit}; ${index}++) {\n`
  props.eval.bindings.withAll(values, () => {
    if (iterate.condition) {
      ctx.push`if (${glslShouldBreak(iterate.condition, props)}) { break; }\n`
    }
    let queue = ""
    for (const [id, update, name] of iterate.update) {
      const local = values[id]!
      const next = glsl(update, props.eval)
      if (local.type !== next.type) {
        throw new Error(
          `Variable ${name} has different types before (${local.type}) and after (${next.type}) evaluating update clause; this is not allowed in 'iterate' clauses within shaders. Try specifying a different initial value for ${name} using a 'from' clause (default is the real number zero).`,
        )
      }
      if (local.list !== next.list) {
        throw new Error(
          `Variable ${name} has different lengths as a list before and after evaluating update clause; this is not allowed in 'iterate' clauses within shaders. Try specifying a different initial value for ${name} using a 'from' clause (default is the real number zero).`,
        )
      }
      if (props.seq) {
        ctx.push`${local.expr} = ${next.expr};\n`
      } else {
        queue += `${local.expr} = ${next.expr};\n`
      }
    }
    ctx.push`${queue}`
  })
  ctx.push`${count.expr}++;\n`
  ctx.push`}\n`

  return { data: values, count }
}
