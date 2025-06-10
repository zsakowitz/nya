import { Chunk, Issues } from "../ast/issue"
import { parse, parseBlockContents } from "../ast/parse"
import { createStream } from "../ast/stream"
import { Block, Exits, type IdMap } from "../emit/decl"
import { emitBlock, emitItem } from "../emit/emit"
import { createStdlib } from "../emit/stdlib"
import type { Value } from "../emit/value"

export class ScriptEnvironment {
  readonly libGl = createStdlib({ lang: "glsl" })
  readonly libJs = createStdlib({ lang: "js" })
  private mainGl = ""
  private mainJs = ""
  private readonly issues = new Issues()
  private readonly loaded = new Set<string>()

  get scriptCount() {
    return this.loaded.size
  }

  load(name: string, script: string) {
    const stream = createStream(new Chunk(name, script), this.issues, {
      comments: false,
    })
    if (this.loaded.has(script)) {
      console.warn(`The script '${name}' has been loaded twice.`)
    }
    this.loaded.add(script)
    const items = parse(stream).items
    if (!this.issues.ok()) {
      throw new Error(this.issues.entries.map((x) => x.toString()).join("\n"))
    }
    for (const item of items) {
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

  evalDetailed(script: string, name = "<repl>", locals?: IdMap<Value>) {
    const chunk = new Chunk(name, script)
    const issues = new Issues()
    const stream = createStream(chunk, issues, { comments: false })
    const contents = parseBlockContents(stream)
    if (!issues.ok()) {
      throw new Error(issues.entries.join("\n"))
    }
    const block = new Block(this.libJs, new Exits(null), locals)
    const result = emitBlock(contents, block)
    if (!issues.ok()) {
      throw new Error(issues.entries.join("\n"))
    }
    const value = result.toRuntime()
    const evald: unknown = (0, eval)(`${this.libJs.globals()}
${this.mainJs}
${block.source}
${value}`)
    return { raw: result, cooked: evald }
  }

  eval(script: string, name?: string, locals?: IdMap<Value>) {
    return this.evalDetailed(script, name, locals).cooked
  }

  log(script: string, name?: string, locals?: IdMap<Value>) {
    try {
      const { raw, cooked } = this.evalDetailed(script, name, locals)
      console.group(`\x1b[30m${script} =\x1b[0m`)
      console.log(cooked, `\x1b[30m::\x1b[35m`, raw.type.toString() + "\x1b[0m")
      console.groupEnd()
    } catch (e) {
      console.error(e instanceof Error ? e.message : e)
    }
  }
}
