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
  "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] p-4 focus:outline-hidden w-full",
)
document.body.appendChild(
  h(
    "flex bg-(--nya-bg) rounded-sm mx-auto w-96 mt-2 max-w-[calc(100%-1rem)]",
    field.el,
  ),
)

const env = new KeyboardController()
env.field = field
env.setLayout(LAYOUTS[0]!)
document.body.appendChild(env.el)
