import "../index.css"
import { CmdFrac } from "./cmd/frac"
import { Paren } from "./cmd/paren"
import { CmdPlus } from "./cmd/token/op/plus"
import { CmdNum } from "./cmd/token/plain/num"
import { Exts, Field } from "./field"
import { Block, L, R } from "./model"

function defer(f: () => void) {
  return { [Symbol.dispose]: f }
}

// Create field
const field = new Field(new Exts().setDefault(CmdNum).set("+", CmdPlus))

// Set up field styles
field.el.classList.add("[line-height:1]", "text-[115%]")
document.body.className =
  "flex flex-col items-center justify-center min-h-screen"
document.body.appendChild(field.el)

// Move cursor to beginning of block
field.cursor.moveInside(field.block, L)

// Do some typing
field.type("2")
field.type("3")
field.type("4")
field.type("+")
field.type("s")
field.type("i")
field.type("n")
field.type("+")
CmdFrac.createLeftOf(field.cursor)
{
  const block = new Block(null)
  new Paren("(", ")", null, block).insertAt(field.cursor, L)
  field.cursor.moveInside(block, L)
  field.type("3")
  field.type("4")
  field.type("9")
  field.type("7")
}
{
  const span = field.cursor
    .clone()
    .moveInside(field.cursor.parent!, R)
    .selection()
  span.extendWithin(L)
  span.extendWithin(L)
  span.flip()
  span.extendWithin(L)
  span.cursor(span.focused).render()
  span.render()
}
