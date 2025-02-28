import { Leaf } from "../field/cmd/leaf"
import type { Options } from "../field/options"
import { h } from "../jsx"

let id = 0

class CmdToken extends Leaf {
  static new(options: Options) {
    return new this(++id, options)
  }

  constructor(
    readonly id: number,
    readonly options: Options,
  ) {
    super("\\token", h("contents"))
  }

  reader(): string {
    return ` Token #${this.id} `
  }
}
