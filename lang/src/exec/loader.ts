import { EmitProps, type Lang } from "!/emit/props"
import { SCRIPTS, type ScriptName } from "#/script-index"
import { Chunk, Issues } from "../ast/issue"
import { ItemUse } from "../ast/node/item"
import { parse, parseBlockContents } from "../ast/parse"
import { createStream } from "../ast/stream"
import { Block, Exits, type Declarations, type IdMap } from "../emit/decl"
import { emitBlock, emitItem } from "../emit/emit"
import { bug } from "../emit/error"
import { createStdlib } from "../emit/stdlib"
import type { Value } from "../emit/value"

function extractDepName(item: ItemUse) {
  if (!item.source) {
    bug(`'use' statement is missing a script name.`)
  }
  const depName = item.source.val.slice(1, -1)
  if (!SCRIPTS.has(depName)) {
    bug(`Dependency '${depName}' does not exist.`)
  }
  return depName as ScriptName
}

export class ScriptEnvironment {
  readonly libGl = createStdlib(new EmitProps("glsl"))
  readonly libJs = createStdlib(new EmitProps("js"))
  private mainGl = ""
  private mainJs = ""
  private readonly issues = new Issues()
  private readonly loaded = new Set<string>()

  get scriptCount() {
    return this.loaded.size
  }

  async load(name: ScriptName) {
    await this._load(name + ".nya", SCRIPTS.get(name)!)
  }

  private async _load(name: string, script: string) {
    if (this.loaded.has(script)) {
      return
    }
    const chunk = new Chunk(name, script)
    const stream = createStream(chunk, this.issues, { comments: false })
    this.loaded.add(script)
    const items = parse(stream).items
    if (!this.issues.ok()) {
      throw new Error(this.issues.entries.map((x) => x.toString()).join("\n"))
    }
    for (const item of items) {
      if (item instanceof ItemUse) {
        this.load(extractDepName(item)) // FIXME: this needs to be awaited but breaks everything if it is
        continue
      }

      const resultGl = emitItem(item, this.libGl)
      if (resultGl?.decl) {
        this.mainGl += "\n" + resultGl.decl
      }

      const resultJs = emitItem(item, this.libJs)
      if (resultJs?.decl) {
        this.mainJs += "\n" + resultJs.decl
      }
    }
    if (!this.issues.ok()) {
      throw new Error(this.issues.entries.map((x) => x.toString()).join("\n"))
    }
  }

  /** Compiles a script as an expression within the JavaScript context. */
  process(
    script: string,
    name = "<repl>",
    locals?: IdMap<Value>,
    lib: Declarations = this.libJs,
  ) {
    const chunk = new Chunk(name, script)
    const issues = new Issues()
    const stream = createStream(chunk, issues, { comments: false })
    const contents = parseBlockContents(stream)
    if (!issues.ok()) {
      throw new Error(issues.entries.join("\n"))
    }
    const block = new Block(lib, new Exits(null), locals)
    const value = emitBlock(contents, block)
    if (!issues.ok()) {
      throw new Error(issues.entries.join("\n"))
    }
    return { block, value }
  }

  /** Creates a function which can be called repeatedly. */
  compile(
    block: Block,
    value: Value,
    args: string,
  ): (...args: unknown[]) => unknown {
    const runtime = value.toRuntime()
    const source = `${this.libJs.globals()}
${this.mainJs}
;(function(${args}){
${block.source}
return ${runtime}
})`
    return (0, eval)(source)
  }

  /** Executes a block and value compiled within the JavaScript context. */
  compute(block: Block, value: Value): unknown {
    const runtime = value.toRuntime()
    const source = `${this.libJs.globals()}
${this.mainJs}
${block.source}
${runtime}`
    return (0, eval)(source)
  }

  log(script: string, name?: string, locals?: IdMap<Value>) {
    try {
      const { block, value } = this.process(script, name, locals)
      const cooked = this.compute(block, value)
      console.group(`\x1b[30m${script} =\x1b[0m`)
      console.log(
        cooked,
        `\x1b[30m::\x1b[35m`,
        value.type.toString() + "\x1b[0m",
      )
      console.groupEnd()
    } catch (e) {
      console.error(e instanceof Error ? e.message : e)
    }
  }

  getMain(lang: Lang): string {
    const lib = lang == "glsl" ? this.libGl : this.libJs
    const main = lang == "glsl" ? this.mainGl : this.mainJs
    return lib.globals() + "\n" + main
  }
}
