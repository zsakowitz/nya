import type { FnSignature } from "@/docs/signature"
import type { Fn } from "@/eval/ops"
import { type WithDocs, ALL_DOCS } from "@/eval/ops/docs"
import { issue } from "@/eval/ops/issue"
import type { SReal } from "@/eval/ty"
import { canCoerce, coerceTyJs, coerceValJs } from "@/eval/ty/coerce"
import { num } from "@/eval/ty/create"
import type { Package } from ".."
import { PKG_REAL } from "../num/real"

function sortJs(args: SReal[]) {
  return args.sort((a, b) => num(a) - num(b))
}

const FN_SORT: Fn & WithDocs = {
  name: "sort",
  label: "sorts the elements of a list",
  docs(): FnSignature[] {
    return [
      {
        params: [{ type: "r32", list: false }],
        dots: true,
        ret: { type: "r32", list: true },
        usage: "sort([8,1,2,13])=[1,2,8,13]",
      },
    ]
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

// TODO: unique should not be dependent on type; make it work everywhere
const FN_UNIQUE: Fn & WithDocs = {
  name: "unique",
  label: "removes any duplicate elements in a list",
  docs() {
    return [
      {
        params: [{ type: "r32", list: false }],
        dots: true,
        ret: { type: "r32", list: true },
        usage: "unique([7,9,8,9,2,3,7])=[7,9,8,2,3]",
      },
    ]
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
  category: "lists",
  deps: [() => PKG_REAL],
  eval: {
    fn: {
      sort: FN_SORT,
      unique: FN_UNIQUE,
    },
  },
}
