import { issue } from "@/lib/error"
import { type NyaApi, v } from "../emit/api"
import { performCall } from "../emit/call"
import type { Block } from "../emit/decl"
import { Id, ident, type IdGlobal } from "../emit/id"
import { Tag } from "../emit/tag"
import { Fn } from "../emit/type"
import { Value } from "../emit/value"

// TODO: this should get shorter the deeper it is; 2.349834+3.3498734i takes up too much space in a displayed list
export const numToLatex = (x: number): string => {
  if (x != x) return "\\wordvar{nan}"
  if (x == 1 / 0) return "\\infty "
  if (x == -1 / 0) return "-\\infty "
  let str = x.toPrecision(8)
  const expIndex = str.indexOf("e")
  let exp = ""
  if (expIndex != -1) {
    const power = str.slice(expIndex + 1).replace(/^\+/, "")
    str = str.slice(0, expIndex)
    exp = "\\times10^{" + power + "}"
  }
  if (str.includes(".")) {
    str = str.replace(/\.?0*$/, "")
  }
  return str + exp
}

export function libLatex(api: NyaApi) {
  const latex = api.opaque("latex", { glsl: null, js: "string" })
  latex.toRuntime = (v) => JSON.stringify(v as any as string)

  const decl = api.lib
  const num = decl.tyNum
  const bool = decl.tyBool
  const fns = decl.fns
  const lang = decl.props.lang

  const idDisplay = ident("%display")

  // `bool` %display
  {
    const idLatexHelper = new Id("%display(x: bool) -> latex").ident()
    const fnLatexHelper = `function ${idLatexHelper}(v){return '\\\\wordvar{'+v+'}'}`
    // prettier-ignore
    function fLatexHelper(v: boolean)                  {return   '\\wordvar{'+v+'}'}

    const f =
      lang == "glsl" ?
        () => new Value(0, latex, true)
      : ([v]: Value[], caller: Block) =>
          new Value(
            v!.const() ? fLatexHelper(v.value as boolean) : (caller.addGlobal(fnLatexHelper), `${idLatexHelper}(${v!.toRuntime()})`),
            latex,
            // @ts-expect-error
            v!.const(),
          )
    fns.push(idDisplay, new Fn(idDisplay, [{ name: "value", type: bool }], latex, f))
  }

  // `num` %display
  {
    const idLatexHelper = new Id("%display(x: num) -> latex").ident()
    const fnLatexHelper = `const ${idLatexHelper}=${numToLatex};` // TODO: Function.prototype.toString is scary

    fns.push(
      idDisplay,
      new Fn(
        idDisplay,
        [{ name: "value", type: num }],
        latex,
        lang == "glsl" ?
          () => new Value(0, latex, true)
        : ([v], caller) =>
            new Value(
              v!.const() ? numToLatex(v.value as number) : (caller.addGlobal(fnLatexHelper), `${idLatexHelper}(${v!.toRuntime()})`),
              latex,
              // @ts-expect-error
              v!.const(),
            ),
      ),
    )
  }

  // `latex` %display
  {
    fns.push(idDisplay, new Fn(idDisplay, [{ name: "value", type: latex }], latex, (x) => x[0]!))
  }

  function createTag(tagIdent: IdGlobal, fnIdent: IdGlobal) {
    return new Tag(
      tagIdent,
      lang == "glsl" ?
        () => new Value(0, latex, true)
      : (text, interps, interpsPos, block) => {
          const results = interps.map((x, i) => {
            const result = performCall(fnIdent, block, [x], interpsPos[i]!, interpsPos[i]!)
            if (result.type == latex) {
              return result
            }
            issue(`The '${tagIdent.label}' tag cannot be used if calling %display on any interpolation does not return LaTeX.`)
          })

          if (results.every((x) => x.const())) {
            return new Value(text.map((x, i) => (i == 0 ? x : (results[i - 1]!.value as string) + x)).join(""), latex, true)
          }

          return new Value(
            text.map((x, i) => (i == 0 ? JSON.stringify(x) : `(${results[i - 1]!.toRuntime()!})` + "+" + JSON.stringify(x))).join("+"),
            latex,
            false,
          )
        },
    )
  }

  decl.tags.set(ident("display"), createTag(ident("display"), idDisplay))

  api.fn("is_empty", { value: latex }, bool, {
    glsl: v`true`,
    js: v`${0}==""`,
  })
}
