import { doesIdentNeedEscaping, escapeIdentName } from "../../lang/src/ast/kind"
import { nameIdent, setGroupTxr, TX_OPS, TX_OPS_OPS, TX_SUFFIXES } from "./tx"

TX_OPS.binding = {
  eval(_, children, block) {
    return block.eval(children[0]!)
  },
  deps(_, children, deps) {
    deps.check(children[0]!)
  },
}

const VALID_NAME = /^[A-Za-z][A-Za-z0-9_]*$/

TX_OPS.bcall = {
  eval(op, children, block) {
    const arg = op.arg || children[0]!
    if (!VALID_NAME.test(op.name.name)) {
      throw new Error(`Function '${op.name.name}' does not have a legal name.`)
    }
    if (op.name.sub) {
      const sub = block.eval(op.name.sub)
      const args = block.evalList(arg).join(",")
      return `${op.name.name}_(${sub},${args})`
    }
    const args = block.evalList(arg).join(",")
    return `${op.name.name}(${args})`
  },
  deps(op, children, deps) {
    deps.check(op.name.sub)
    deps.check(op.arg || children[0]!)
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

TX_OPS.ucall = {
  eval(op, _, block) {
    const args = block.evalList(op.arg).join(",")
    if (block.decls.isFunction(op.name)) {
      return `${nameIdent(op.name)}(${args})`
    } else {
      return `${nameIdent(op.name)}(${args})`
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
    return block.of`%frac(${a},${b})`
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

TX_OPS.uvar = {
  eval(op) {
    return nameIdent(op)
  },
  deps(op, _, deps) {
    deps.add(op)
  },
}

TX_OPS.op = {
  eval(op, children, block) {
    const args = children.map((x) => block.eval(x)).join(",")
    if (!doesIdentNeedEscaping(op)) {
      return `${op}(${args})`
    }
    return `call ${escapeIdentName(op, true)}(${args})`
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

TX_OPS_OPS["%juxtapose"] = {
  eval(_, [a, b], block) {
    return block.of`(${a!})*(${b!})`
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

TX_SUFFIXES.exponent = {
  eval(op, on, block) {
    return `%pow(${on},${block.eval(op)})`
  },
  deps(op, _, deps) {
    deps.check(op)
  },
}
