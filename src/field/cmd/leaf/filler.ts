import type { Command } from "@/field/model"
import { h } from "@/jsx"
import { Leaf } from "."

export class CmdFiller extends Leaf {
  static fromLatex(): Command {
    return new CmdFiller()
  }

  constructor() {
    super("", h("inline-block w-1"))
  }

  reader(): string {
    return ""
  }

  ascii(): string {
    return ""
  }

  latex(): string {
    return ""
  }
}
