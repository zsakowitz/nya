import { h } from "@/jsx"
import { createKeyboard } from "."

const el = h(
  "flex flex-col h-screen bg-[--nya-kbd-bg]",
  h("flex w-[320px] mx-auto mt-auto", createKeyboard()),
)

document.body.appendChild(el)
