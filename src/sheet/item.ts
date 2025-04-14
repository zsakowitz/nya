import type { GlslResult } from "@/eval/lib/fn"
import type { VDir } from "@/field/sides"
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import type { ItemRef } from "./items"
import type { Plottable } from "./ui/cv/item"

export interface ItemFactory<T, U = unknown, V = unknown> {
  id: string
  name: string
  icon: IconDefinition
  group?: boolean

  /** The passed {@linkcode ItemRef} is mostly uninitialized. */
  init(ref: ItemRef<T>, source: string | undefined, from: U | undefined): T
  aside?(data: T): Node
  main(data: T): Node
  plot?: Plottable<T, V>
  glsl?(data: T): GlslResult | undefined
  unlink(data: T): void
  /** `from` is only `null` immediately after creation. */
  focus(data: T, from: VDir | null): void
  encode(data: T): string
  error?(data: T, message: string): void

  /**
   * Defaults to zero; if two items are loaded with the same ID, the higher one
   * wins. If the same layer is added twice, the earlier one wins.
   */
  layer?: number
}

export type AnyItemFactory = ItemFactory<unknown>
