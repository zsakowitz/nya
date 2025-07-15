import { JsContext } from "@/eval/lib/jsctx"
import { options } from "@/field/defaults"
import { Field } from "@/field/field"
import { h } from "@/jsx"
import { Scope } from "@/sheet/deps"
import { KeyboardController } from "../controller"
import { LAYOUTS } from "../layout"

const field = new Field(
  options,
  new Scope(options, new JsContext(null)),
  "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] p-4 focus:outline-none max-w-full bg-[--nya-bg] rounded mt-8 mx-auto w-96 [&.\\!bg-transparent]:!bg-[--nya-bg]",
)
field.typeLatex(String.raw`\left(23\right]`)
document.body.appendChild(h("flex bg-[--nya-kbd-bg]", field.el))

const el = h(
  "block bg-[--nya-kbd-bg] min-h-screen pt-8 pb-[180px]",
  h(
    "grid grid-cols-[300px,300px] bg-[--nya-kbd-bg] gap-4 justify-center",
    ...LAYOUTS.map((x) => {
      const env = new KeyboardController(() => field)
      env.show(x)
      env.el.classList.remove("fixed")
      return env.el
    }),
  ),
)

document.body.appendChild(el)
