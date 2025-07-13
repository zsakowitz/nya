import { h } from "@/jsx"
import { createKeyboard } from "."

const el = h(
  "flex flex-col gap-4 px-4 py-4",
  h("border border-black w-[320px]", createKeyboard()),
  h("border border-black w-[400px]", createKeyboard()),
  h("border border-black w-full", createKeyboard()),
)

document.body.appendChild(el)
