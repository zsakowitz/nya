import "../index.css"
import { ByRegex } from "./cmd/by-regex"
import { CmdFrac } from "./cmd/frac"
import { CmdNoop } from "./cmd/noop"
import { CmdBrack } from "./cmd/paren"
import { CmdSubSup } from "./cmd/supsub"
import { OpCdot, OpMinus, OpPlus } from "./cmd/token/op"
import { CmdNumAutoSubscript } from "./cmd/token/plain/num"
import { CmdVar } from "./cmd/token/plain/var"
import { Exts, Field } from "./field"
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
    .set("_", CmdSubSup),
)

// Set up field styles
field.el.classList.add("[line-height:1]", "text-[1.265rem]")
document.body.className =
  "flex flex-col items-center justify-center min-h-screen"
document.body.appendChild(field.el)

// Move cursor to beginning of block
field.cursor.moveInside(field.block, L)

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

// show latex
{
  const p = document.createElement("p")
  p.textContent = field.block.latex()
  p.className = "font-['Carlito','Symbola','Times'] text-center mt-8"
  document.body.appendChild(p)
}
