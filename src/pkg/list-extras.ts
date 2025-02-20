import type { Package } from "."
import type { Fn } from "../eval/ops"
import { array, docByIcon, icon } from "../eval/ops/dist"
import { type WithDocs, ALL_DOCS } from "../eval/ops/docs"
import { issue } from "../eval/ops/issue"
import type { SReal } from "../eval/ty"
import { canCoerce, coerceTyJs, coerceValJs } from "../eval/ty/coerce"
import { num } from "../eval/ty/create"
import { PKG_REAL } from "./num-real"

function sortJs(args: SReal[]) {
  return args.sort((a, b) => num(a) - num(b))
}

const FN_SORT: Fn & WithDocs = {
  name: "sort",
  label: "sorts the elements of a list",
  docs() {
    return [docByIcon([array(icon("r32"))], icon("r32"), true)]
  },
  js(args) {
    const value =
      (
        args.length == 1 &&
        args[0]!.list !== false &&
        canCoerce(args[0]!.type, "r32")
      ) ?
        coerceTyJs(args[0]!, "r32").value
      : (
        args.length >= 1 &&
        args.every(
          (x): x is typeof x & { list: false } =>
            x.list === false && canCoerce(args[0]!.type, "r32"),
        )
      ) ?
        args.map((x) => coerceValJs(x, "r32").value)
      : issue("'sort' expects a single list of real numbers.")()

    return {
      type: "r32",
      list: value.length,
      value: sortJs(value),
    }
  },
  glsl: issue("Cannot compute 'sort' in shaders yet."),
}

ALL_DOCS.push(FN_SORT)

const FN_UNIQUE: Fn & WithDocs = {
  name: "unique",
  label: "removes any duplicate elements in a list",
  docs() {
    return [docByIcon([array(icon("r32"))], icon("r32"), true)]
  },
  js(args) {
    const value =
      (
        args.length == 1 &&
        args[0]!.list !== false &&
        canCoerce(args[0]!.type, "r32")
      ) ?
        coerceTyJs(args[0]!, "r32").value
      : (
        args.length >= 1 &&
        args.every(
          (x): x is typeof x & { list: false } =>
            x.list === false && canCoerce(args[0]!.type, "r32"),
        )
      ) ?
        args.map((x) => coerceValJs(x, "r32").value)
      : issue("'unique' expects a single list of real numbers.")()

    const seen = new Set<number>()
    const ret: SReal[] = []

    for (const item of value) {
      const raw = num(item)
      if (!seen.has(raw)) {
        seen.add(raw)
        ret.push(item)
      }
    }

    return {
      type: "r32",
      list: ret.length,
      value: ret,
    }
  },
  glsl: issue("Cannot compute 'unique' in shaders yet."),
}

ALL_DOCS.push(FN_UNIQUE)

export const PKG_LIST_EXTRAS: Package = {
  id: "nya:list-extras",
  name: "extra list functions",
  label: null,
  deps: [() => PKG_REAL],
  eval: {
    fns: {
      sort: FN_SORT,
      unique: FN_UNIQUE,
    },
  },
}
