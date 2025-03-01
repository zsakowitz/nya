import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning"
import type { Package } from "."
import type { Node } from "../eval/ast/token"
import { BindingFn, id } from "../eval/lib/binding"
import type { TyName } from "../eval/ty"
import { TY_INFO } from "../eval/ty/info"
import { Leaf } from "../field/cmd/leaf"
import { CmdUnknown } from "../field/cmd/leaf/unknown"
import { fa } from "../field/fa"
import { type LatexParser } from "../field/latex"
import {
  L,
  R,
  Span,
  type Command,
  type Cursor,
  type InitProps,
  type InitRet,
} from "../field/model"
import { h } from "../jsx"
import type { Scope } from "../sheet/deps"

function iconError() {
  return h(
    "",
    h(
      "text-orange-500 size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
      h("opacity-25 block bg-current absolute inset-0"),
      fa(
        faWarning,
        "fill-current absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px]",
      ),
    ),
  )
}

function iconFunction() {
  return h(
    "",
    h(
      "text-slate-500 size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
      h("opacity-25 block bg-current absolute inset-0"),
      h(
        "size-[7px] bg-current absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      ),
    ),
  )
}

const data = new WeakMap<Scope, TokenCtx>()

class TokenCtx {
  constructor(readonly scope: Scope) {
    const existing = data.get(scope)
    if (existing) return existing

    scope.hooks.push(() => this.update())
  }

  private readonly tracking = new Map<number, CmdToken[]>()
  readonly tokens = new Map<number, HTMLElement>()

  track(cmd: CmdToken) {
    let d: CmdToken[]
    const list =
      this.tracking.get(cmd.id) ?? (this.tracking.set(cmd.id, (d = [])), d)
    if (list.indexOf(cmd) == -1) {
      list.push(cmd)
    }
  }

  untrack(cmd: CmdToken) {
    const list = this.tracking.get(cmd.id)
    if (!list) return

    const idx = list.indexOf(cmd)
    if (idx != -1) {
      list.splice(idx, 1)
    }
  }

  update() {
    this.tokens.clear()
    for (const [key, tokens] of this.tracking) {
      if (tokens.length == 0) continue

      let type: TyName | "__function" | undefined
      try {
        const val = this.scope.bindingsJs.get(id({ value: "$" + key }))
        if (val instanceof BindingFn) {
          type = "__function"
        } else if (val) {
          type = val.type
        }
      } catch (e) {
        try {
          const val = this.scope.bindingsGlsl.get(id({ value: "$" + key }))
          if (val instanceof BindingFn) {
            type = "__function"
          } else if (val) {
            type = val.type
          }
        } catch (f) {
          console.warn("[tokenctx.update]", e, f)
        }
      }

      if (type) {
        if (type.endsWith("64")) {
          type = (type.slice(0, -2) + "32") as TyName
        }
        this.tokens.set(
          key,
          type == "__function" ? iconFunction() : (
            (TY_INFO[type]?.icon() ?? iconError())
          ),
        )
      }

      let el = this.tokens.get(key) ?? iconError()
      for (const token of tokens) {
        while (token.el.firstChild) {
          token.el.firstChild.remove()
        }
        token.el.append(el.cloneNode(true))
      }
    }

    this.queueCleanup()
  }

  private _queued = false

  private cleanup() {
    for (const [key, tokens] of this.tracking) {
      for (let i = 0; i < tokens.length; i++) {
        if (!tokens[i]!.el.isConnected) {
          tokens.splice(i, 1)
          i--
        }
      }

      if (tokens.length == 0) {
        this.tracking.delete(key)
      }
    }
  }

  queueCleanup() {
    if (this._queued) return

    queueMicrotask(() => {
      this._queued = false
      this.cleanup()
    })
  }
}

let nextId = 0

class CmdToken extends Leaf {
  static init(cursor: Cursor, props: InitProps): InitRet {
    this.new(new TokenCtx(props.ctx.scope)).insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, parser: LatexParser): Command {
    const arg = parser.text()
    const id = parseInt(arg, 10)

    if (isFinite(id)) {
      return new CmdToken(id, new TokenCtx(parser.ctx.scope))
    }

    return new CmdUnknown(`‹token›`)
  }

  static new(ctx: TokenCtx) {
    return new this(nextId++, ctx)
  }

  constructor(
    readonly id: number,
    readonly ctx: TokenCtx,
  ) {
    if (id >= nextId) {
      nextId = id + 1
    }
    super("\\token", h("", ctx.tokens.get(id)?.cloneNode(true) ?? iconError()))
    ctx.track(this)
  }

  reader(): string {
    return ` Token #${this.id} `
  }

  ir(tokens: Node[]): true | void {
    tokens.push({
      type: "var",
      kind: "var",
      span: new Span(this.parent, this[L], this[R]),
      value: "$" + this.id,
    })
  }

  ascii(): string {
    return `token(${this.id})`
  }

  latex(): string {
    return `\\token{${this.id}}`
  }
}

export const PKG_TOKEN: Package = {
  id: "nya:token",
  name: "tokens",
  label: "icon variables",
  field: {
    inits: {
      "@": CmdToken,
    },
    latex: {
      "\\token": CmdToken,
    },
  },
}
