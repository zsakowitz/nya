import "../index.css"
import { CmdBrack } from "./cmd/brack"
import { ByRegex } from "./cmd/by-regex"
import { CmdFrac } from "./cmd/frac"
import { OpCdot, OpMinus, OpPlus } from "./cmd/leaf/op"
import { CmdNumAutoSubscript } from "./cmd/leaf/plain/num"
import { CmdVar } from "./cmd/leaf/plain/var"
import { CmdMoveLeft, CmdMoveRight } from "./cmd/move"
import { CmdNoop } from "./cmd/noop"
import { CmdSubSup } from "./cmd/supsub"
import { Exts, Field } from "./field"
import { h } from "./jsx"
import { L } from "./model"

// Create field
const field = new Field(
  new Exts()
    .setDefault(
      new ByRegex([
        [/^\d$/, CmdNumAutoSubscript],
        [/^\w$/, CmdVar],
        [/^\s$/, CmdNoop],
        [/^[()[\]{}]$/, CmdBrack],
      ]),
    )
    .set("+", OpPlus)
    .set("-", OpMinus)
    .set("*", OpCdot)
    .set("/", CmdFrac)
    .set("^", CmdSubSup)
    .set("ArrowLeft", CmdMoveLeft)
    .set("ArrowRight", CmdMoveRight)
    .set("_", CmdSubSup),
)

// Set up field styles
field.el.classList.add("[line-height:1]", "text-[1.265rem]")
document.body.className =
  "flex flex-col items-center justify-center min-h-screen"
document.body.appendChild(field.el)

// Move cursor to beginning of block
field.cursor.moveIn(field.block, L)

field.type("2")
field.type("*")
field.type("3")
field.type("a")
field.type("4")
field.type("5")
field.type("6")
field.type("8")
field.type("^")
field.type("9")
field.type("2")
field.type("3")
field.type("^")
field.type("9")
field.type("^")
field.type("5")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("+")
field.type("3")
field.type("4")
field.type("/")
field.type("5")
field.type("ArrowRight")
field.type("ArrowLeft")
field.type("^")
field.type("2")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("3")
field.type("a")
field.type("2")
field.type("ArrowLeft")

const cursor = h(/*class=*/ "border-black p-0 m-0 -ml-px border-l")
field.cursor.render(cursor)

// show latex
{
  const p = document.createElement("p")
  p.textContent = field.block.latex()
  p.className = "font-['Carlito','Symbola','Times'] text-center mt-8"
  document.body.appendChild(p)
}
