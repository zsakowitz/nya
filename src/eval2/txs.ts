import { escapeIdentName } from "../../lang/src/ast/kind"
import { issue } from "../../lang/src/emit/error"
import type { Node } from "./node"
import { nameIdent, setGroupTxr, TX_OPS, TX_OPS_OPS, TX_SUFFIXES } from "./tx"

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
    const id = nameIdent(op)
    return (
      block.local(id) ??
      (op.sub ?
        issue(`Variable '${id}' is not defined.`)
      : escapeIdentName(op.name, false))
    )
  },
  deps(op, _, deps) {
    deps.add(op)
  },
}

TX_OPS.ucall = {
  eval(op, _, block) {
    const args = block.evalList(op.arg)
    const id = nameIdent(op.name)
    const fn = block.localOrFn(id)
    if (fn == null) {
      issue(`Variable '${id}' is not defined.`)
    }
    if (typeof fn == "object") {
      if (fn.args.length != args.length) {
        issue(`Incorrect number of arguments to function '${id}'.`)
      }
      return `{${fn.args.map((name, i) => `let ${name}=${args[i]};`).join("")}${fn.body}}`
    }
    if (args.length == 1) {
      return `${fn}*(${args[0]!})`
    } else {
      return `${fn}*%point(${args.join(",")})`
    }
  },
  deps(op, _, deps) {
    deps.add(op.name)
    deps.check(op.arg)
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

TX_OPS.suffix = {
  eval(op, children, block) {
    let base = block.eval(children[0]!)
    for (const suffix of op) {
      base = block.evalSuffix(suffix, base)
    }
    return base
  },
  deps(op, children, deps) {
    deps.check(children[0]!)
    for (const suffix of op) {
      TX_SUFFIXES[suffix.type]?.deps(suffix.data as never, null, deps)
    }
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

// Similar to 'sop'; make sure to match changes between the two.
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

// Similar to 'bcall'; make sure to match changes between the two.
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

TX_OPS_OPS["cmp-eq"] = {
  eval(_, [a, b], block) {
    return block.of`(${a!})==(${b!})`
  },
  deps(_, [a, b], deps) {
    deps.check(a!)
    deps.check(b!)
  },
}

// calls %juxtapose or *, preferring %juxtapose
TX_OPS_OPS["%juxtapose"] = {
  eval(_, [a, b], block) {
    return block.of`call * %juxtapose(${a!},${b!})`
  },
  deps(_, [a, b], deps) {
    deps.check(a!)
    deps.check(b!)
  },
}

// calls %dot or *, preferring %dot
TX_OPS_OPS["\\cdot "] = {
  eval(_, [a, b], block) {
    return block.of`call * %dot(${a!},${b!})`
  },
  deps(_, [a, b], deps) {
    deps.check(a!)
    deps.check(b!)
  },
}

// calls %cross or *, preferring %cross
TX_OPS_OPS["\\times "] = {
  eval(_, [a, b], block) {
    return block.of`call * %cross(${a!},${b!})`
  },
  deps(_, [a, b], deps) {
    deps.check(a!)
    deps.check(b!)
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
