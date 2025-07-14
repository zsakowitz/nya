import { h } from "@/jsx"
import { KeyboardController } from "./controller"
import { createKeyboard, LAYOUTS } from "./layout"

document.body.appendChild(new KeyboardController().el)

const el = h(
  "block bg-[--nya-kbd-bg] min-h-screen pt-8 pb-[180px]",
  h(
    "grid grid-cols-[300px,300px] bg-[--nya-kbd-bg] gap-4 justify-center",
    ...LAYOUTS.map((x) => (x && createKeyboard(x)) ?? h()),
  ),
)

document.body.appendChild(el)
