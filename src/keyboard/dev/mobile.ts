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
  "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] p-4 focus:outline-none max-w-[calc(100%_-_1rem)] bg-[--nya-bg] rounded mt-2 mx-auto w-96 [&.\\!bg-transparent]:!bg-[--nya-bg]",
)
document.body.appendChild(h("flex", field.el))

const env = new KeyboardController(() => field)
env.show(LAYOUTS[0]!)
document.body.appendChild(env.el)
