import { h } from "@/jsx"
import { KeyboardController } from "./controller"
import { createKeyboard, LAYOUTS } from "./layout"

document.body.appendChild(new KeyboardController().el)

const el = h(
  "block bg-[--nya-kbd-bg] h-screen",
  h(
    "grid grid-cols-[300px,300px] bg-[--nya-kbd-bg] gap-4 py-8 justify-center",
    ...LAYOUTS.map(createKeyboard),
  ),
)

document.body.appendChild(el)
