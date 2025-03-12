import { ALL } from "../all"
import { options } from "../field/defaults"
import { show } from "../show"
import SRC_LOCALHOST from "./example/localhost.txt"
import SRC_STANDARD from "./example/standard.txt"
import { SheetFactory } from "./factory"
import { Expr } from "./ui/expr"

const SHORT_EXPRS = true

const factory = new SheetFactory(options)

const IS_DEV = "NYA_DEV" in globalThis
for (const pkg of ALL) {
  factory.load(pkg)
}

const sheet = factory.create()
document.body.appendChild(sheet.el)

function expr(source: string) {
  if (source.startsWith("#")) {
    sheet.list.fromString(source)
    return
  }

  let doShow = false
  if (source.startsWith("@")) {
    doShow = true
    source = source.slice(1)
  }
  const expr = Expr.of(sheet)
  expr.field.typeLatex(source)
  if (doShow) {
    show(expr)
  }
}

const src = SHORT_EXPRS && IS_DEV ? SRC_LOCALHOST : SRC_STANDARD

src.split("\n").forEach((x) => x && expr(x))
