import { h } from "@/jsx"
import { createKeyboard, LAYOUT_STANDARD } from "."

const el = h(
  "flex h-screen bg-[--nya-kbd-bg] gap-8",
  h("flex w-[320px] mt-auto", createKeyboard(LAYOUT_STANDARD)),
  h("flex w-[320px] mt-auto", createKeyboard(LAYOUT_STANDARD)),
)

document.body.appendChild(el)
