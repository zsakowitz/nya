import { Leaf } from "."
import type { TyName } from "../../../eval/ty"
import { TY_INFO } from "../../../eval/ty/info"
import { h } from "../../../jsx"
import type { LatexParser } from "../../latex"
import type { Command } from "../../model"
import { CmdUnknown } from "./unknown"

export class CmdTyName extends Leaf {
  static fromLatex(cmd: string, parser: LatexParser): Command {
    const ty = parser.text()
    if (ty in TY_INFO) {
      return new this(ty as TyName)
    } else {
      return new CmdUnknown(`${cmd}{${ty}}`)
    }
  }

  constructor(readonly ty: TyName) {
    super("\\tyname ", TY_INFO[ty].icon?.() || h("", ty))
  }

  ascii(): string {
    return ""
  }

  latex(): string {
    return `\\tyname{${this.ty}}`
  }

  reader(): string {
    return ` Type ${this.ty} `
  }

  ir(): true | void {}
}
