import type { NyaApi } from "!/emit/api"
import type { Sheet } from "@/sheet/ui/sheet"
import type { PackageId } from "."
import type { ScriptName } from "./script-index"

type PackageCategory = "auto-generated (nyalang)"

// SHAPE: maybe use consistent shapes
export interface Package {
  name: string
  label: string | null // TODO: write better labels
  category: PackageCategory
  deps: readonly PackageId[]
  scripts?: readonly ScriptName[]

  api?(api: NyaApi): void
  load?(): void
  init?: {
    intents: readonly string[]
    fn(sheet: Sheet): void
  }
}

export interface Addon extends Package {
  label: string
}

export interface Doc {
  name: string
  poster: string
  render(): HTMLElement[]
}

export interface ToolbarItem {
  (sheet: Sheet): HTMLSpanElement
}
