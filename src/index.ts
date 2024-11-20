import "../index.css"
import { ByRegex } from "./cmd/by-regex"
import { CmdFrac } from "./cmd/frac"
import { CmdNoop } from "./cmd/noop"
import { CmdBrack } from "./cmd/paren"
import { CmdPlus } from "./cmd/token/op/plus"
import { CmdNum } from "./cmd/token/plain/num"
import { CmdVar } from "./cmd/token/plain/var"
import { Exts, Field } from "./field"
import { Block, L, R } from "./model"

// Create field
const field = new Field(
  new Exts()
    .setDefault(
      new ByRegex([
        [/^\d$/, CmdNum],
        [/^\w$/, CmdVar],
        [/^\s$/, CmdNoop],
        [/^[()[\]{}]$/, CmdBrack],
      ]),
    )
    .set("+", CmdPlus)
    .set("/", CmdFrac),
)

// Set up field styles
field.el.classList.add("[line-height:1]", "text-[115%]")
document.body.className =
  "flex flex-col items-center justify-center min-h-screen"
document.body.appendChild(field.el)

// Move cursor to beginning of block
field.cursor.moveInside(field.block, L)

// some typing
{
  field.type("2")
  field.type("3")
  field.type("4")
  field.type("+")
  field.type("s")
  field.type("i")
  field.type("n")
  field.type("+")
  field.type("(")
  field.type("2")
  field.type("+")
  field.type("3")
  field.type(")")
  field.type("/")
}

// add (3497)
{
  const block = new Block(null)
  new CmdBrack("(", ")", null, block).insertAt(field.cursor, L)
  field.cursor.moveInside(block, L)
  field.type("3")
  field.type("4")
  field.type("9")
  field.type("7")
}

// remove the 9 using selections
{
  const sel = field.cursor
    .clone()
    .moveInside(field.cursor.parent!, R)
    .selection()
  sel.moveFocus(L)
  sel.moveFocus(L)
  sel.flip()
  sel.moveFocus(L)
  sel.remove()
}

// mess with parentheses
{
  field.cursor.moveWithin(L)
  field.type("s")
  field.type("(")
  field.type("r")
  field.type("q")
  field.type("]")
  console.log(field.cursor)
  field.type("b")
}

field.type("/")
field.type("4")
field.type("3")
field.type("/")
field.type("2")
field.type("/")
field.type("1")

// show latex
{
  const p = document.createElement("p")
  p.textContent = field.block.intoLatex()
  p.className = "font-['Carlito','Symbola','Times'] text-center mt-8"
  document.body.appendChild(p)
}
