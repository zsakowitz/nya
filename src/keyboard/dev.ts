import { h } from "@/jsx"
import { createKeyboard, LAYOUT_STANDARD } from "."

const el = h(
  "flex flex-col h-screen bg-[--nya-kbd-bg]",
  h("flex w-[320px] mx-auto mt-auto", createKeyboard(LAYOUT_STANDARD)),
)

document.body.appendChild(el)
