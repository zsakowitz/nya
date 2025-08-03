import { Id } from "../emit/id"

const JS_KEYWORDS =
  "break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with implements interface let package private protected public static yield abstract accessor async await boolean constructor declare keyof module namespace readonly number object set undefined as".split(
    " ",
  )

function isAcceptableJsIdent(x: string) {
  return /^[A-Za-z_][A-Za-z0-9_$]*$/.test(x) && !JS_KEYWORDS.includes(x)
}

export function encodeIdentForTS(x: string) {
  if (isAcceptableJsIdent(x)) {
    return x
  }
  return new Id("").ident()
}
