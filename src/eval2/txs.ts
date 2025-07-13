import { escapeIdentName } from "!/ast/kind"
import { issue, todo } from "!/emit/error"
import { Id, ident } from "!/emit/id"
import type { PuncCmp } from "@/eval/ast/token"
import { type NameCooked, type Node, type OpKind, type Suffix } from "./node"
import { P, PRECEDENCE_WORD_BINARY } from "./prec"
import {
  listItems,
  nameIdent,
  printVar,
  ScriptBlock,
  setGroupTxr,
  TX_OPS,
  TX_OPS_OPS,
  TX_SUFFIXES,
} from "./tx"

function fnSuperscript({ data, args }: Node): string {
  if (data.type == "num") {
    if (/^\d+$/.test(data.data)) {
      return data.data
    }
  }

  if (data.type == "op" && args?.length == 1 && data.data == "-") {
    const d1 = args[0]!.data
    if (d1.type == "num" && d1.data == "1") {
      return "-1"
    }
  }

  issue(
    `Function names may only take positive integers and -1 as superscripts.`,
  )
}

TX_OPS.binding = {
  eval(_, children, block) {
    return block.eval(children[0]!)
  },
  deps(_, children, deps) {
    deps.check(children[0]!)
  },
}

TX_OPS.list = {
  eval() {
    throw new Error(`Cannot directly evaluate a comma-separated list.`)
  },
  deps(_, children, deps) {
    for (const el of children) {
      deps.check(el)
    }
  },
}

TX_OPS.uvar = {
  eval(op, _, block) {
    return (
      block.local(op) ??
      (op.sub ?
        issue(`Variable '${printVar(op)}' is not defined.`)
      : escapeIdentName(op.name, false))
    )
  },
  deps(op, _, deps) {
    deps.add(op)
  },
}

function ucall(
  op: OpKind["ucall"],
  block: ScriptBlock,
  suffix: (x: string) => string,
) {
  const args = block.evalList(op.arg)
  const fn = block.localOrFn(op.name)
  if (fn == null) {
    issue(`Variable '${printVar(op.name)}' is not defined.`)
  }
  if (typeof fn == "object") {
    if (fn.args.length != args.length) {
      issue(`Incorrect number of arguments to function '${printVar(op.name)}'.`)
    }
    return suffix(
      `{${fn.args.map((name, i) => `let ${name}=${args[i]};`).join("")}${fn.body}}`,
    )
  }
  if (args.length == 1) {
    return `call * %juxtapose(${fn},${suffix(args[0]!)})`
  } else {
    return `call * %juxtapose(${fn},${suffix(`%point(${args.join(",")})`)})`
  }
}

// This is special-cased in `suffix` so that c(3)^2 is evaluated as (4)(3^2) is c=4
TX_OPS.ucall = {
  eval(op, _, block) {
    return ucall(op, block, (x) => x)
  },
  deps(op, _, deps) {
    deps.add(op.name)
    deps.check(op.arg)
  },
}

function evalSuffixes(base: string, block: ScriptBlock, suffixes: Suffix[]) {
  for (const suffix of suffixes) {
    base = block.evalSuffix(suffix, base)
  }
  return base
}

TX_OPS.suffix = {
  eval(suffixes, children, block) {
    const arg = children[0]!

    // Special casing for 'ucall' nodes so that c(3)^2 is evaluated as (4)(3^2) if c=4
    if (arg.data.type == "ucall") {
      const op = arg.data.data
      return ucall(op, block, (x) => evalSuffixes(x, block, suffixes))
    }

    return evalSuffixes(block.eval(arg), block, suffixes)
  },
  deps(op, children, deps) {
    deps.check(children[0]!)
    for (const suffix of op) {
      TX_SUFFIXES[suffix.type]?.deps(suffix.data as never, null, deps)
    }
  },
}

TX_OPS.combination = {
  eval([a, b], _, block) {
    return block.of`%choose(${a},${b})`
  },
  deps([a, b], _, deps) {
    deps.check(a)
    deps.check(b)
  },
}

TX_OPS.frac = {
  eval([a, b], _, block) {
    return block.of`call / %frac(${a},${b})`
  },
  deps([a, b], _, deps) {
    deps.check(a)
    deps.check(b)
  },
}

TX_OPS.nthroot = {
  eval({ root, contents }, _, block) {
    return block.of`%nthroot(${root},${contents})`
  },
  deps({ root, contents }, _, deps) {
    deps.check(root)
    deps.check(contents)
  },
}

// TODO: this doesn't take 'base' into account
TX_OPS.num = {
  eval(op) {
    return parseFloat(op) + ""
  },
  deps() {},
}

TX_OPS.sqrt = {
  eval(contents, _, block) {
    return block.of`%sqrt(${contents})`
  },
  deps(contents, _, deps) {
    deps.check(contents)
  },
}

const ALIASES: Record<string, string> = {
  // @ts-expect-error
  __proto__: null,
  log: "log10",

  "arcsin^-1": "sin",
  "arccos^-1": "cos",
  "arctan^-1": "tan",
  "arccsc^-1": "csc",
  "arcsec^-1": "sec",
  "arccot^-1": "cot",

  arcsin: "asin",
  arccos: "acos",
  arctan: "atan",
  arccsc: "acsc",
  arcsec: "asec",
  arccot: "acot",
  "sin^-1": "asin",
  "cos^-1": "acos",
  "tan^-1": "atan",
  "csc^-1": "acsc",
  "sec^-1": "asec",
  "cot^-1": "acot",

  "arcsinh^-1": "sinh",
  "arccosh^-1": "cosh",
  "arctanh^-1": "tanh",
  "arccsch^-1": "csch",
  "arcsech^-1": "sech",
  "arccoth^-1": "coth",
  "arsinh^-1": "sinh",
  "arcosh^-1": "cosh",
  "artanh^-1": "tanh",
  "arcsch^-1": "csch",
  "arsech^-1": "sech",
  "arcoth^-1": "coth",

  arcsinh: "asinh",
  arccosh: "acosh",
  arctanh: "atanh",
  arccsch: "acsch",
  arcsech: "asech",
  arccoth: "acoth",
  "sinh^-1": "asinh",
  "cosh^-1": "acosh",
  "tanh^-1": "atanh",
  "csch^-1": "acsch",
  "sech^-1": "asech",
  "coth^-1": "acoth",
}

TX_OPS.op = {
  eval(op, children, block) {
    const args = children.map((x) => block.eval(x)).join(",")
    const name = op
    return `call ${escapeIdentName(name, true)}(${args})`
  },
  deps(_, children, deps) {
    for (const el of children) {
      deps.check(el)
    }
  },
}

// Similar to 'sop' and 'bvar'; make sure to match changes between the two.
TX_OPS.bcall = {
  eval(op, _, block) {
    const sub = op.name.sub ? block.eval(op.name.sub) : null
    const args = block.evalList(op.arg).join(",")
    const sup = op.sup ? fnSuperscript(op.sup) : null
    const name =
      op.name.name + (sub == null ? "" : "_") + (sup == "-1" ? "^-1" : "")
    const inner = `call ${escapeIdentName(name in ALIASES ? ALIASES[name]! : name, true)}(${sub == null ? "" : sub + ","}${args})`
    if (sup != null && sup != "-1") {
      return `(${inner})^${sup}`
    } else {
      return inner
    }
  },
  deps(op, _, deps) {
    deps.check(op.name.sub)
    deps.check(op.arg)
  },
}

// Similar to 'bcall' and 'bvar'; make sure to match changes between the two.
TX_OPS.sop = {
  eval(op, children, block) {
    const sub = op.sub ? block.eval(op.sub) : null
    const args = children.map((x) => block.eval(x)).join(",")
    const sup = op.sup ? fnSuperscript(op.sup) : null
    const name = op.name + (sub == null ? "" : "_") + (sup == "-1" ? "^-1" : "")
    const inner = `call ${escapeIdentName(name in ALIASES ? ALIASES[name]! : name, true)}(${sub == null ? "" : sub + ","}${args})`
    if (sup != null && sup != "-1") {
      return `(${inner})^${sup}`
    } else {
      return inner
    }
  },
  deps(_, children, deps) {
    for (const el of children) {
      deps.check(el)
    }
  },
}

// Similar to 'bcall' and 'sop'; make sure to match changes.
TX_OPS.bvar = {
  eval(op, children, block) {
    const sub = op.sub ? block.eval(op.sub) : null
    const args = children.map((x) => block.eval(x)).join(",")
    const name = op.name + (sub == null ? "" : "_")
    const inner = `call ${escapeIdentName(name in ALIASES ? ALIASES[name]! : name, true)}(${sub == null ? "" : sub + ","}${args})`
    return inner
  },
  deps(_, children, deps) {
    for (const el of children) {
      deps.check(el)
    }
  },
}

setGroupTxr("(", ")", {
  eval({ contents }, _, block) {
    if (contents.data.type == "list") {
      return `%point(${block.evalList(contents).join(",")})`
    } else {
      return block.eval(contents)
    }
  },
  deps({ contents }, _, deps) {
    deps.check(contents)
  },
})

setGroupTxr("[", "]", {
  eval({ contents }, _, block) {
    return `[${block.evalList(contents).join(",")}]`
  },
  deps({ contents }, _, deps) {
    deps.check(contents)
  },
})

setGroupTxr("|", "|", {
  eval({ contents }, _, block) {
    return block.of`call abs %abs(${contents})`
  },
  deps({ contents }, _, deps) {
    deps.check(contents)
  },
})

TX_SUFFIXES.exponent = {
  eval(op, on, block) {
    return `call ^(${on},${block.eval(op)})`
  },
  deps(op, _, deps) {
    deps.check(op)
  },
}

TX_SUFFIXES.factorial = {
  eval(_, on) {
    return `%factorial(${on})`
  },
  deps() {},
}

function alias(name: string, nya: string) {
  TX_OPS_OPS[name] = {
    eval(_, x, block) {
      return `call ${nya}(${x.map((x) => block.eval(x))})`
    },
    deps(_, x, deps) {
      for (const el of x) {
        deps.check(el)
      }
    },
  }
}

function cmp(name: PuncCmp, nameneg: PuncCmp, nya: string) {
  TX_OPS_OPS[name] = {
    eval(_, [a, b], block) {
      // TODO: chain comparisons
      // if (b!.data.type == "op" && b!.data.data.startsWith("cmp-")) {
      //   const mid = b!.args![0]!
      //   const id = new Id("middle value")
      //   const srhs = new ParseNode<Data>({ type: "op", data: b!.data.data }, [
      //     new ParseNode<Data>(),
      //   ])
      //   return `{let ${id}=${block.eval(mid)};(${block.eval(a!)}) ${nya}(${id})&&(${block.eval(new ParseNode())})}`
      // }
      return `(${block.eval(a!)}) ${nya}(${block.eval(b!)})`
    },
    deps(_, [a, b], deps) {
      deps.check(a!)
      deps.check(b!)
    },
  }

  TX_OPS_OPS[nameneg] = {
    eval(_, [a, b], block) {
      return `!((${block.eval(a!)}) ${nya}(${block.eval(b!)}))`
    },
    deps(_, [a, b], deps) {
      deps.check(a!)
      deps.check(b!)
    },
  }
}

cmp("cmp-eq", "cmp-neq", "==")
cmp("cmp-lt", "cmp-nlt", "<")
cmp("cmp-lte", "cmp-nlte", "<=")
cmp("cmp-gt", "cmp-ngt", ">")
cmp("cmp-gte", "cmp-ngte", ">=")

alias("%juxtapose", "* %juxtapose")
alias("\\cdot ", "* %dot")
alias("\\times ", "* %cross")
alias("mod", "% mod")
alias("\\odot ", "%odot")
alias("and", "&& and")
alias("or", "|| or")
PRECEDENCE_WORD_BINARY.and = [P.BoolAndL, P.BoolOrR]
PRECEDENCE_WORD_BINARY.or = [P.BoolOrL, P.BoolOrR]

TX_OPS_OPS["debugAst"] = {
  eval(_, [a]) {
    return `json#"${JSON.stringify(a, undefined, 2)}"#`
  },
  deps(_) {},
}

function dbg(a: Node): string {
  const ty = a.data.type
  const sub = a.args?.map(dbg)
  return ty + (sub?.length ? `(${sub.join(", ")})` : "")
}

TX_OPS_OPS["debugAstType"] = {
  eval(_, [a]) {
    return `json#"${JSON.stringify(dbg(a!))}"#`
  },
  deps(_) {},
}

TX_OPS_OPS["debugScript"] = {
  eval(_, [a], block) {
    const evald = block.eval(a!)
    return `json#"${JSON.stringify(evald)}"#`
  },
  deps(_, [a], deps) {
    deps.check(a!)
  },
}

type LocalBinding = [OpKind["binding"], Node]

function parseAsBinding(node: Node): LocalBinding | null {
  if (
    node.data.type == "op" &&
    node.data.data == "cmp-eq" &&
    node.args?.length == 2
  ) {
    const lhs = node.args[0]!
    const rhs = node.args[1]!
    if (lhs.data.type == "uvar") {
      return [{ name: lhs.data.data, args: null }, rhs]
    }
    if (lhs.data.type == "ucall") {
      const { name, arg } = lhs.data.data
      const args = listItems(arg).map((x) => x.data)
      if (args.every((x) => x.type == "uvar")) {
        return [{ name, args: args.map((x) => x.data) }, rhs]
      }
    }
  }

  return null
}

function parseAsBindingList(
  node: Node,
  errFirst: string,
  errNonFirst: string,
): LocalBinding[] {
  const items = listItems(node)
  if (items.length == 0) {
    return []
  }
  const first = parseAsBinding(items[0]!)
  if (!first) {
    issue("0 " + errFirst)
  }
  const rest = items
    .slice(1)
    .map((x, i) => parseAsBinding(x) || issue(i + 1 + " " + errNonFirst))
  return [first, ...rest]
}

TX_OPS_OPS["with"] = {
  eval(_, [value, bindings], block) {
    const items = parseAsBindingList(
      bindings!,
      `'with' must be followed by one or more variable definitions.`,
      `'with' must be followed by one or more variable definitions.`,
    )
    const sub = block.child()
    let decls = ""
    for (const [binding, value] of items) {
      if (binding.args) {
        todo(`'with' cannot be followed by a function definition.`)
      }
      const thisValue = block.eval(value)
      const thisName = binding.name
      const cachedName = new Id(nameIdent(thisName)).ident()
      sub.leakyLocals.set(ident(nameIdent(thisName)), cachedName)
      decls += `let ${cachedName}=${thisValue};`
    }
    return `{${decls}${sub.eval(value!)}}`
  },
  deps(_, [value, bindings], deps) {
    const items = parseAsBindingList(
      bindings!,
      `'with' must be followed by one or more variable definitions.`,
      `'with' must be followed by one or more variable definitions.`,
    )
    const ids: NameCooked[] = []
    for (const [binding, value] of items) {
      ids.push(binding.name)
      deps.ignore(binding.args, () => deps.check(value))
    }
    deps.ignore(ids, () => deps.check(value!))
  },
}

TX_OPS.surreal = {
  eval({ lhs, rhs }, _, block) {
    return `%surreal(%surreal_join(${block.evalList(lhs)}),%surreal_join(${block.evalList(rhs)}))`
  },
  deps(op, _, deps) {
    deps.check(op.lhs)
    deps.check(op.rhs)
  },
}

PRECEDENCE_WORD_BINARY.with = [P.WithL, P.WithR]
PRECEDENCE_WORD_BINARY.for = [P.WithL, P.WithR]
