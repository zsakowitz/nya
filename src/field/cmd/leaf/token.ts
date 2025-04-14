import type { Node } from "@/eval/ast/token"
import { BindingFn, BindingGlslValue, id } from "@/eval/lib/binding"
import type { JsVal, TyName } from "@/eval/ty"
import { TY_INFO } from "@/eval/ty/info"
import { L, R } from "@/field/sides"
import { h, sx } from "@/jsx"
import type { Scope } from "@/sheet/deps"
import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning"
import { Leaf } from "."
import { fa } from "../../fa"
import type { LatexParser } from "../../latex"
import {
  Span,
  type Command,
  type Cursor,
  type InitProps,
  type InitRet,
} from "../../model"
import { CmdUnknown } from "./unknown"

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

export function createToken(color: string, ...paths: SVGElement[]) {
  const svg = sx(
    "svg",
    {
      "class":
        "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-transparent stroke-current overflow-visible",
      "viewBox": "0 0 1 1",
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    },
    ...paths,
  )

  document.body.append(svg)
  const rect = svg.getBBox({ fill: true, stroke: false })
  svg.remove()

  const xc = rect.x + rect.width / 2
  const yc = rect.y + rect.height / 2
  const size = Math.max(rect.width, rect.height)
  svg.setAttribute(
    "viewBox",
    `${xc - size / 2} ${yc - size / 2} ${size} ${size}`,
  )
  svg.setAttribute("stroke-width", size / 8 + "")

  return h(
    "",
    h(
      {
        class:
          "size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
        style: `color:${color}`,
      },
      h("opacity-25 block bg-current absolute inset-0"),
      svg,
    ),
  )
}

const data = new WeakMap<Scope, TokenCtx>()

export class TokenCtx {
  constructor(readonly scope: Scope) {
    const existing = data.get(scope)
    if (existing) return existing

    scope.hooks.push(() => this.update())
  }

  private readonly tracking = new Map<bigint, CmdToken[]>()
  readonly tokens = new Map<bigint, HTMLElement>()

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
      let val: JsVal | undefined
      try {
        const value = this.scope.bindingsJs.get(id({ value: "$" + key }))
        if (value instanceof BindingFn) {
          type = "__function"
        } else if (value) {
          if (value.list === false) {
            val = value
          }
          type = value.type
        }
      } catch (e) {
        try {
          const value = this.scope.bindingsGlsl.get(id({ value: "$" + key }))
          if (value instanceof BindingFn) {
            type = "__function"
          } else if (value instanceof BindingGlslValue) {
            type = "__function"
          } else if (value) {
            type = value.type
          }
        } catch {
          console.warn(
            "[tokenctx.update]",
            e instanceof Error ? e.message : String(e),
          )
        }
      }

      let token
      if (val && (token = TY_INFO[val.type].token?.(val.value as never))) {
        this.tokens.set(key, token)
      } else if (type) {
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

let nextId = 0n

export class CmdToken extends Leaf {
  static init(cursor: Cursor, props: InitProps): InitRet {
    this.new(props.scope).insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, parser: LatexParser): Command {
    const arg = parser.text()
    const id = BigInt(arg)

    if (id >= 0n) {
      return new CmdToken(id, new TokenCtx(parser.scope))
    }

    return new CmdUnknown(`‹token›`)
  }

  static new(scope: Scope) {
    return new this(nextId++, new TokenCtx(scope))
  }

  constructor(
    readonly id: bigint,
    readonly ctx: TokenCtx,
  ) {
    if (id >= nextId) {
      nextId = id + 1n
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

  clone() {
    return new CmdToken(this.id, this.ctx)
  }
}
