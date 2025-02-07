import { options } from "../field/defaults.js"
import { exts } from "./ext/defaults.js"
import { Expr } from "./ui/expr/index.js"
import { Sheet } from "./ui/sheet/index.js"

const sheet = new Sheet(options, exts)
document.body.appendChild(sheet.el)

function expr(source: { raw: readonly string[] }) {
  const expr = new Expr(sheet)
  expr.field.typeLatex(source.raw[0]!)
  return expr
}

expr`A=\left(2,3\right)`
