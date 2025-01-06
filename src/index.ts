// import "./field/index.js"

import { OpEq } from "./field/cmd/leaf/cmp.js"
import { CmdWord } from "./field/cmd/leaf/word.js"
import { exts, options } from "./field/defaults.js"
import { L, R } from "./field/model.js"
import { Expr, Sheet } from "./sheet/index.js"

const sheet = new Sheet(exts, { field: options })

{
  const expr = new Expr(sheet)
  expr.field.setPrefix(({ block }) => {
    const cursor = block.cursor(R)
    new CmdWord("var", "detail").insertAt(cursor, L)
    new OpEq(false).insertAt(cursor, L)
  })
  expr.field.typeEach("5 0")
}

{
  const expr = new Expr(sheet)
  expr.field.typeEach("y = 2 x ^ 2 ArrowRight - 7 x + 3 ArrowLeft ArrowLeft")
  setTimeout(() => expr.field.el.focus())
}

{
  const expr = new Expr(sheet)
  expr.field.typeEach("p o l y g o n ( ( 2 , 3 ) , ( 7 , - 3 ) , ( 1 , 0 ) )")
}

document.body.appendChild(sheet.el)
