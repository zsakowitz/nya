import type { Package } from "#/types"
import { example } from "@/docs/core"
import type { MagicVar, Node } from "@/eval/ast/token"
import { glsl, js, NO_SYM } from "@/eval/ast/tx"
import type { Deps } from "@/eval/deps"
import type { PropsGlsl } from "@/eval/glsl"
import type { PropsJs } from "@/eval/js"
import {
  type Binding,
  id,
  name,
  parseBindings,
  parseUpdateVar,
  tryParseBindingVar,
} from "@/eval/lib/binding"
import { type GlslValue, type JsValue, type Type, typeName } from "@/eval/ty"
import { coerceValueGlsl, isReal } from "@/eval/ty/coerce"
import { num, real } from "@/eval/ty/create"
import { declareGlsl } from "@/eval/ty/decl"
import { list } from "@/eval/ty/list"
import { b, p } from "@/jsx"

declare module "@/eval/ast/token" {
  interface PuncListInfix {
    while: 0
    until: 0
    from: 0
  }
}

interface IterateCondition {
  type: "while" | "until"
  value: Node
}

type IterateRetval = "count" | { id: string; name: string }

interface Iterate {
  update: Binding[]
  from: [...Binding, explicit: boolean][]

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

interface ParseIterateProps {
  source: "expr" | "with" | "withseq"
}

function parseIterate(
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
          for (const [id, , name] of from.values) {
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
  for (const [id, , name] of bindings) {
    if (props.source != "withseq" && id in ids) {
      throw new Error(
        `Cannot update ${name} twice. Maybe you meant 'withseq iterate'?`,
      )
    }
    ids[id] = true
  }

  if (from?.type == "list") {
    for (const [id, , name] of from.values) {
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
        span: null,
      },
      name,
      !!(
        from &&
        (from.type == "value" ?
          from.value
        : from.values.find((x) => x[0] == id)?.[1])
      ),
    ]),
  }

  return iterate
}

interface DoIterateProps<T> {
  /**
   * Whether to evaluate updates in sequence. Defaults to `false`, for parallel
   * updates.
   */
  seq: boolean
  eval: T
}

function getLimit(node: Node, props: PropsJs): number {
  const value = js(node, props)
  if (value.list !== false) {
    throw new Error("Limit of 'iterate' must be a single number.")
  }
  if (!isReal(value)) {
    throw new Error("Limit of 'iterate' must be a number.")
  }
  const real = Math.floor(num(value.value))
  if (!(0 <= real && real <= 1000)) {
    throw new Error("Limit of 'iterate' must be between 0 and 1000.")
  }

  return real
}

function jsShouldBreak(
  condition: IterateCondition,
  props: DoIterateProps<PropsJs>,
): boolean {
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

function iterateJs(
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
    if (
      iterate.condition &&
      props.eval.bindingsJs.withAll(values, () =>
        jsShouldBreak(iterate.condition!, props),
      )
    ) {
      break
    }

    if (props.seq) {
      for (const [id, update] of iterate.update) {
        values[id] = props.eval.bindingsJs.withAll(values, () =>
          js(update, props.eval),
        )
      }
    } else {
      props.eval.bindingsJs.withAll(values, () => {
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

function iterateGlsl(
  iterate: Iterate,
  props: DoIterateProps<PropsGlsl>,
): { data: Record<string, GlslValue>; count: GlslValue } {
  const limit = getLimit(iterate.limit, props.eval)
  const { ctx } = props.eval

  const values: Record<string, GlslValue> = Object.create(null)
  for (const [id, from] of iterate.from) {
    const value = glsl(from, props.eval)
    const name = ctx.name()
    ctx.push`${declareGlsl(value, name)} = ${value.expr};\n`
    values[id] = { ...value, expr: name }
  }

  const firstIterTypes: Record<string, Type> = Object.create(null)
  const oldCtx = props.eval.ctx
  try {
    props.eval.ctx = props.eval.ctx.fork()

    if (props.seq) {
      for (const [id, update] of iterate.update) {
        const virtualValues = { ...values }
        Object.setPrototypeOf(virtualValues, null)
        props.eval.bindings.withAll(
          virtualValues,
          () =>
            (virtualValues[id] = firstIterTypes[id] = glsl(update, props.eval)),
        )
      }
    } else {
      props.eval.bindings.withAll(values, () => {
        for (const [id, update] of iterate.update) {
          firstIterTypes[id] = glsl(update, props.eval)
        }
      })
    }
  } finally {
    props.eval.ctx = oldCtx
  }

  for (const [id, , name, explicit] of iterate.from) {
    const from = values[id]!
    const prev = from
    const type = firstIterTypes[id]!
    try {
      const expr = coerceValueGlsl(props.eval.ctx, from, type)
      const name = ctx.name()
      ctx.push`${declareGlsl(type, name)} = ${expr};\n`
      values[id] = {
        expr: name,
        list: type.list,
        type: type.type,
      }
    } catch {
      throw new Error(
        `Variable ${name} has different types before (${typeName(prev)}) and after (${typeName(type)}) evaluating update clause; this is not allowed in 'iterate' clauses within shaders.` +
          (explicit ? "" : (
            " Note that 0 was inferred to be the initial value since you didn't specify any actual initial value."
          )),
      )
    }
  }

  const count = ctx.name()
  ctx.push`int ${count};\n`
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
      if (local.type !== next.type || local.list !== next.list) {
        throw new Error(
          `Variable ${name} has different types before (${typeName(local)}) and after (${typeName(next)}) evaluating update clause; this is not allowed in 'iterate' clauses within shaders.` +
            (iterate.from.find((x) => x[0] == id)?.[3] ?
              ""
            : " Note that 0 was inferred to be the initial value since you didn't specify any actual initial value."),
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
  ctx.push`${count}++;\n`
  ctx.push`}\n`

  return {
    data: values,
    count: {
      type: "r64",
      expr: `vec2(${count}, 0)`,
      list: false,
    },
  }
}

function iterateDeps(iterate: Iterate, deps: Deps): string[] {
  deps.add(iterate.limit)

  const ids = iterate.update.map((x) => x[0])

  for (const [, node] of iterate.from) {
    deps.add(node)
  }

  deps.withBoundIds(ids, () => {
    for (const [, node] of iterate.update) {
      deps.add(node)
    }
    if (iterate.condition) {
      deps.add(iterate.condition.value)
    }
  })

  return ids
}

export default {
  name: "iterate",
  label: "easily repeat expressions",
  category: "miscellaneous",
  deps: ["num/real", "with"],
  eval: {
    tx: {
      magic: {
        iterate: {
          label: "iterates a variable substitution",
          sym: NO_SYM,
          helpers: ["while", "until", "from"],
          js(node, props) {
            if (node.value == "iterate") {
              const parsed = parseIterate(node, { source: "expr" })
              const { data, count } = iterateJs(parsed, {
                eval: props,
                seq: false,
              })
              if (parsed.retval == "count") {
                return { type: "r64", list: false, value: real(count) }
              } else {
                return data[parsed.retval!.id]!
              }
            }
            throw new Error(
              `The '${node.value}' operator is not supported yet.`,
            )
          },
          glsl(node, props) {
            if (node.value == "iterate") {
              const parsed = parseIterate(node, { source: "expr" })
              const { data, count } = iterateGlsl(parsed, {
                eval: props,
                seq: false,
              })
              if (parsed.retval == "count") {
                return count
              } else {
                return data[parsed.retval!.id]!
              }
            }
            throw new Error(
              `The '${node.value}' operator is not supported yet.`,
            )
          },
          deps(node, deps) {
            if (node.value == "iterate") {
              const parsed = parseIterate(node, { source: "expr" })
              iterateDeps(parsed, deps)
            }
          },
          with: {
            label:
              "iterates over multiple variables, exposing all results to the left of the 'with' operator",
            js(node, props, seq) {
              return iterateJs(
                parseIterate(node, { source: seq ? "withseq" : "with" }),
                {
                  seq,
                  eval: props,
                },
              ).data
            },
            glsl(node, props, seq) {
              return iterateGlsl(
                parseIterate(node, { source: seq ? "withseq" : "with" }),
                {
                  seq,
                  eval: props,
                },
              ).data
            },
            deps(node, deps, seq) {
              return iterateDeps(
                parseIterate(node, { source: seq ? "withseq" : "with" }),
                deps,
              )
            },
          },
        },
      },
    },
  },
  docs: [
    {
      name: "iteration",
      poster: "iterate^{50}z\\to z^2+c",
      render() {
        return [
          p(
            "The ",
            b("iterate"),
            " function lets you compute an expression multiple times using its previous value as part of the computation. For example:",
          ),
          example(
            String.raw`\operatorname{iterate}^{50}n\to n+2\operatorname{from}n=3`,
            "=103",
          ),
          p(
            "You can also add a ",
            b("while"),
            " or ",
            b("until"),
            " clause to limit when the expression stops iterating. The condition is evaluated before each iteration.",
          ),
          example(
            String.raw`\operatorname{iterate}^{100}z\to 2z\operatorname{while}z<100\operatorname{from}z=2`,
            "=128",
          ),
          p(
            "As an alternate form, you can write ",
            b("iterate"),
            " after ",
            b("with"),
            " to get access to its result on the left side of the ",
            b("with"),
            " expression.",
          ),
          example(
            String.raw`a\operatorname{with}\operatorname{iterate}^{10}a\to 2a\operatorname{from}a=1`,
            "=1024",
          ),
          p(
            "In this alternate form, you can iterate over multiple variables at once. Note that variables are updated all at once, not in sequence.",
          ),
          example(
            String.raw`a\operatorname{with}\operatorname{iterate}^{10}\begin{list}n\to n+1\\a\to a+n\end{list}\operatorname{from}\begin{list}n=0\\a=0\end{list}`,
            "=45",
          ),
          p(
            "By the way, you can type ",
            b("list"),
            " to create a vertical list, like the ones in that last example. Alternatively, you can just separate the elements with commas:",
          ),
          example(
            String.raw`a\operatorname{with}\operatorname{iterate}^{10}n\to n+1,a\to a+n\operatorname{from}n=0,a=0`,
            "=45",
          ),
          p(
            "If you want to update each variable in order, use ",
            b("withseq iterate"),
            ".",
          ),
          example(
            String.raw`a\operatorname{withseq}\operatorname{iterate}^{10}\begin{list}n\to n+1\\a\to a+n\end{list}\operatorname{from}\begin{list}n=0\\a=0\end{list}`,
            "=55",
          ),
          example(
            String.raw`a\operatorname{withseq}\operatorname{iterate}^{10}\begin{list}a\to a+n\\n\to n+1\end{list}\operatorname{from}\begin{list}n=0\\a=0\end{list}`,
            "=45",
          ),
          p(
            "If you're iterating over multiple variables, you can use ",
            b("iterate.name"),
            " as a shortcut for ",
            b("name with iterate"),
            ".",
          ),
          example(
            String.raw`\operatorname{iterate}.a^{10}\begin{list}n\to n+1\\a\to a+n\end{list}\operatorname{from}\begin{list}n=0\\a=0\end{list}`,
            "=45",
          ),
          p(
            "You can also use ",
            b("iterate.count"),
            " to return the number of iterations instead of any particular variable. This is usually only useful if you also have a ",
            b("while"),
            " or ",
            b("until"),
            " clause.",
          ),
          example(
            String.raw`\operatorname{iterate}.\operatorname{count}^{20}z\to 2z\operatorname{from}z=1\operatorname{while}z<500`,
            "=9",
          ),
          p(
            "Finally, note that variables default to zero if you don't specify an initial value.",
          ),
          example(String.raw`\operatorname{iterate}^{20}z\to z+1`, "=20"),
          p(
            "Note that in shaders, iteration is significantly more restricted than usual. The variable you're iterating over can't change type, so you can't grow or shrink a list, change a number to a color, or do anything similar.",
          ),
        ]
      },
    },
  ],
} satisfies Package
