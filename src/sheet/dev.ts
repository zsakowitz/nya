import { createDocs2 } from "@/docs/big"
import { options } from "@/field/defaults"
import { show } from "@/show"
import SRC_LOCALHOST from "./example/localhost.txt"
import SRC_STANDARD from "./example/standard.txt"
import { SheetFactory } from "./factory"
import { Expr } from "./ui/expr"

const LOAD_EMPTY = false
const SHORT_EXPRS = true

const factory = new SheetFactory(options)

const IS_DEV = "NYA_DEV" in globalThis
if (!(LOAD_EMPTY && IS_DEV)) {
  for (const pkg of (await import("@/all")).allPackages()) {
    factory.load(pkg)
  }
}
if (IS_DEV) {
  setTimeout(async () => (await import("@/test")).runTests())
}

const sheet = factory.create()
document.body.appendChild(createDocs2(sheet))
// document.body.appendChild(sheet.el)

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
