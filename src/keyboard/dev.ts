import { h } from "@/jsx"
import { createKeyboard, LAYOUTS } from "."

const el = h(
  "block bg-[--nya-kbd-bg] h-screen",
  h(
    "grid grid-cols-[300px,300px] bg-[--nya-kbd-bg] gap-4 py-8 justify-center",
    ...LAYOUTS.map(createKeyboard),
  ),
)

document.body.appendChild(el)
