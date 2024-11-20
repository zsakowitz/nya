import "../index.css"
import { ByRegex } from "./cmd/by-regex"
import { CmdFrac } from "./cmd/frac"
import { CmdNoop } from "./cmd/noop"
import { CmdBrack } from "./cmd/paren"
import { OpCdot, OpMinus, OpPlus } from "./cmd/token/op"
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
    .set("+", OpPlus)
    .set("-", OpMinus)
    .set("*", OpCdot)
    .set("/", CmdFrac),
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

// show latex
{
  const p = document.createElement("p")
  p.textContent = field.block.intoLatex()
  p.className = "font-['Carlito','Symbola','Times'] text-center mt-8"
  document.body.appendChild(p)
}
