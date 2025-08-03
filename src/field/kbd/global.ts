import type { FieldInert } from "@/field/field-inert"
import { KeyboardController } from "./controller"

const GLOBAL_KEYBOARD = new KeyboardController()
document.body.appendChild(GLOBAL_KEYBOARD.el)

function detectMobile() {
  return !matchMedia("(pointer: fine) and (hover: hover)").matches
}

export function showKeyboard(field: FieldInert) {
  GLOBAL_KEYBOARD.field = field
  if (detectMobile()) {
    GLOBAL_KEYBOARD.setVisible(true)
  }
}

export function hideKeyboard() {
  GLOBAL_KEYBOARD.setVisible(false)
}
