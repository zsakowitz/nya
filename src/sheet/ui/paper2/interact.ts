import type { Point } from "."
import type { JsVal } from "../../../eval/ty"
import type { Block } from "../../../field/model"

export interface DragProps {
  (at: Point): DragFn | null
}

export interface DragFn {
  (at: Point, done: boolean): void
}

export const HANDLER_DRAG = new WeakMap<SVGElement, DragProps>()

export interface PickProps {
  val(): JsVal
  ref(): Block
}

export const HANDLER_PICK = new WeakMap<SVGElement, PickProps>()
