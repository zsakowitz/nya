import "../../index.css"
import { BIG_ALIASES, CmdBig } from "./cmd/big"
import { CmdBrack } from "./cmd/brack"
import { ByRegex } from "./cmd/by-regex"
import { CmdBackspace, CmdDel, CmdMove, CmdTab } from "./cmd/cursor"
import { CmdFrac } from "./cmd/frac"
import { OpEq, OpGt, OpLt } from "./cmd/leaf/cmp"
import { CmdComma } from "./cmd/leaf/comma"
import { CmdDot } from "./cmd/leaf/dot"
import { CmdNumAutoSubscript } from "./cmd/leaf/num"
import { OpCdot, OpMinus, OpPlus } from "./cmd/leaf/op"
import { CmdVar } from "./cmd/leaf/var"
import { CmdMap } from "./cmd/map"
import { CmdMatrix } from "./cmd/matrix"
import { CmdNoop } from "./cmd/noop"
import { CmdSupSub } from "./cmd/supsub"
import { Exts, Field } from "./field"
import { h } from "./jsx"
import { D, L, R, U, type Init } from "./model"

const CmdPrompt: Init = {
  init() {
    const val = prompt("type a latex command")
    if (!val) return
    field.type("\\" + val)
  },
  initOn() {
    const val = prompt("type a latex command")
    if (!val) return
    field.type("\\" + val)
  },
}

const exts = new Exts()
  .setDefault(
    new ByRegex([
      [/^\d$/, CmdNumAutoSubscript],
      [/^\w$/, CmdVar],
      [/^\s$/, CmdNoop],
      [/^[()[\]{}]$/, CmdBrack],
    ]),
  )
  // basic ops
  .set("+", OpPlus)
  .set("-", OpMinus)
  .set("*", OpCdot)
  .set("/", CmdFrac)
  // equality ops
  .set("=", OpEq)
  .set("<", OpLt)
  .set(">", OpGt)
  // other cmds
  .setAll(["_", "^"], CmdSupSub)
  .setAll(Object.keys(BIG_ALIASES), CmdBig)
  .set("s", new CmdMap(CmdBig, () => "\\sum"))
  .set("m", CmdMatrix)
  .set(",", CmdComma)
  .set(".", CmdDot)
  // movement ops
  .set("ArrowLeft", CmdMove(L))
  .set("ArrowRight", CmdMove(R))
  .set("ArrowUp", CmdMove(U))
  .set("ArrowDown", CmdMove(D))
  .set("Backspace", CmdBackspace)
  .set("Del", CmdDel)
  .set("Delete", CmdDel)
  .set("Tab", CmdTab)
  // manual latex
  .set("\\", CmdPrompt)

const field = new Field(exts)

// Set up field styles
field.el.classList.add("[line-height:1]", "text-[1.265rem]")
document.body.className =
  "flex flex-col items-center justify-center min-h-screen"
document.body.appendChild(field.el)

const latex = h("text-center block text-sm break-all px-8 text-balance mt-8")
document.body.appendChild(latex)

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
field.type("0")
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
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowRight")
field.type("^")
field.type("4")
field.type("3")
field.type("6")
field.type("ArrowRight")
field.type("/")
field.type("2")
field.type("/")
field.type("3")
field.type("ArrowRight")
field.type("+")
field.type("4")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowDown")
field.type("ArrowLeft")
field.type("ArrowUp")
field.type("ArrowDown")
field.type("ArrowUp")
field.type("ArrowDown")
field.type("ArrowDown")
field.type("ArrowDown")
field.type("4")
field.type("3")
field.type("2")
field.type("1")
field.type("9")
field.type("3")
field.type("4")
field.type("2")
field.type("ArrowUp")
field.type("ArrowUp")
field.type("ArrowUp")
field.type("ArrowUp")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("\\sum")
field.type("2")
field.type("3")
field.type("ArrowUp")
field.type("4")
field.type("9")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("n")
field.type("m")

const cursor = h("border-current w-px -ml-px border-l")
render()

function unrender() {
  field.sel.each(({ el }) => el.classList.remove("bg-zlx-selection"))
  cursor.parentElement?.classList.remove("!bg-transparent")
  cursor.remove()
}

function render() {
  field.sel.each(({ el }) => el.classList.add("bg-zlx-selection"))
  field.sel.cursor(field.sel.focused).render(cursor)
  cursor.parentElement?.classList.add("!bg-transparent")
  latex.textContent = field.block.latex()
}

addEventListener("keydown", (x) => {
  unrender()
  field.type(x.key, x)
  render()
})
