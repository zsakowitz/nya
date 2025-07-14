import type { Command } from "@/field/model"
import { h } from "@/jsx"
import { Leaf } from "."

export class CmdFiller extends Leaf {
  static fromLatex(cmd: string): Command {
    return new CmdFiller(cmd == "\\nyafillersmall")
  }

  constructor(small: boolean) {
    super("", small ? h("inline-block") : h("inline-block w-1"))
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
