import { options } from "../field/defaults"
import { show } from "../show"
import SRC_LOCALHOST from "./example/localhost.txt"
import SRC_STANDARD from "./example/standard.txt"
import { SheetFactory } from "./factory"
import { Expr } from "./ui/expr"

const LOAD_EMPTY = false
const SHORT_EXPRS = true

const factory = new SheetFactory(options)

if (!(LOAD_EMPTY && location.href.includes("localhost"))) {
  for (const pkg of (await import("../all")).ALL) {
    factory.load(pkg)
  }
}

const sheet = factory.create()
document.body.appendChild(sheet.el)

function expr(source: string) {
  let doShow = false
  if (source.startsWith("@")) {
    doShow = true
    source = source.slice(1)
  }
  const expr = new Expr(sheet)
  expr.field.typeLatex(source)
  if (doShow) {
    show(expr)
  }
}

const src =
  SHORT_EXPRS && location.href.includes("localhost") ?
    SRC_LOCALHOST
  : SRC_STANDARD

src.split("\n").forEach((x) => x && expr(x))
