// import "./sheet/dev.js"
import "../index.css"
import { exts, latexCmds, options } from "./field/defaults"
import { FieldInert } from "./field/field-inert"
import { hx } from "./field/jsx"
import { LatexParser } from "./field/latex"

const el = hx(
  "input",
  "block w-full border border-slate-400 px-2 py-1 bg-slate-200 mx-4 mt-4 font-mono",
)
const field = new FieldInert(exts, options)
field.el.className += " bg-slate-100 border border-slate-200 p-3"
const err = hx("p", "text-red-500")
el.addEventListener("input", () => {
  err.classList.add("hidden")
  field.el.classList.remove("hidden")
  try {
    const block = new LatexParser(latexCmds, options, el.value).parse()
    field.block.clear()
    field.block.insert(block, null, null)
  } catch (e) {
    field.el.classList.add("hidden")
    err.classList.remove("hidden")
    err.textContent
  }
})
document.body.append(el, field.el, err)
