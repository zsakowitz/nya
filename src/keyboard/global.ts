import type { Field } from "@/field/field"
import { KeyboardController } from "./controller"

const GLOBAL_KEYBOARD = new KeyboardController()
document.body.appendChild(GLOBAL_KEYBOARD.el)

export function showKeyboard(field: Field) {
  GLOBAL_KEYBOARD.field = field
  GLOBAL_KEYBOARD.setVisible(true)
}

export function hideKeyboard() {
  GLOBAL_KEYBOARD.setVisible(false)
}
