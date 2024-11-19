import "../index.css"
import { CmdFrac } from "./cmd/frac"
import { CmdPlus } from "./cmd/token/op/plus"
import { CmdNum } from "./cmd/token/plain/num"
import { Block, Exts, Field, LEFT } from "./core"

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
using _ = defer(() => field.cursor.render())

// Move cursor to beginning of block
field.cursor.placeInsideOf(field.block, LEFT)

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
