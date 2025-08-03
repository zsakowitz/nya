import { todo } from "@/lib/error"
import type { NyaApi } from "../emit/api"
import { FixedArray, invalidType, VarArray } from "../emit/type"
import { Value } from "../emit/value"

export function libArray(api: NyaApi) {
  const lib = api.lib
  const num = lib.tyNum
  const numArray = new VarArray(lib.props, num)
  const { lang } = api.lib.props

  api.fmanual("sort", { x: numArray }, numArray, (args, _, _1, fullPos) => {
    const arg = args[0]!
    if (!(arg.type instanceof FixedArray)) {
      invalidType(numArray, arg.type, fullPos)
    }
    if (arg.type.count <= 1) {
      return arg
    }
    if (arg.const()) {
      return new Value(
        (arg.value as number[]).slice().sort(
          (a, b) =>
            a < b ? -1
            : a > b ? 1
            : +(a != a) - +(b != b), // nan is stupid and so are ±0
        ),
        arg.type,
        true,
      )
    }
    if (lang == "glsl") {
      todo(`Cannot sort arrays with more than 1 entry in shaders.`)
    }
    return new Value(`(${arg}).slice().sort((a,b)=>a<b?-1:a>b?1:(a!=a)-(b!=b))`, arg.type, false)
  })
}
