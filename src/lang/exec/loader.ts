import { EmitProps, type Lang } from "!/emit/props"
import { FixedArray, ArrayEmpty, type Type } from "!/emit/type"
import { createStdlib } from "!/std"
import { SCRIPTS, type ScriptName } from "@/pkg/script-index"
import { getScriptPath } from "@/pkg/scripts"
import { UtilityFnCache } from "@/eval/util"
import { Chunk, Issues } from "../ast/issue"
import { ItemUse } from "../ast/node/item"
import { parse, parseBlockContents } from "../ast/parse"
import { createStream } from "../ast/stream"
import {
  Block,
  BlockGlobals,
  Exits,
  type Declarations,
  type IdMap,
} from "../emit/decl"
import { emitBlock, emitItem } from "../emit/emit"
import { bug, errorText } from "../emit/error"
import { Value } from "../emit/value"

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

  private readonly issues = new Issues()
  private readonly loaded = new Set<string>()
  readonly utils = new UtilityFnCache(this)

  get scriptCount() {
    return this.loaded.size
  }

  load(name: ScriptName) {
    this._load(getScriptPath(name), SCRIPTS.get(name)!)
  }

  // eventually this will be async since scripts may load dependencies
  // asynchronously, but the current architecture of "all scripts known at
  // comptime" means it's fine as synchronous for now
  _load(name: string, script: string) {
    if (this.loaded.has(script)) {
      return
    }
    this.utils.markStale()
    const chunk = new Chunk(name, script)
    const stream = createStream(chunk, this.issues, { comments: false })
    this.loaded.add(script)
    const items = parse(stream).items
    if (!this.issues.ok()) {
      throw new Error(this.issues.entries.map((x) => x.toString()).join("\n"))
    }
    for (const item of items) {
      if (item instanceof ItemUse) {
        this.load(extractDepName(item))
        continue
      }

      emitItem(item, this.libGl)
      emitItem(item, this.libJs)
    }
    if (!this.issues.ok()) {
      throw new Error(this.issues.entries.map((x) => x.toString()).join("\n"))
    }
  }

  /** Compiles a script as an expression. Defaults to a JavaScript context. */
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
    const globals = new BlockGlobals(lib)
    const block = new Block(globals, new Exits(null), locals)
    const value = emitBlock(contents, block)
    if (!issues.ok()) {
      throw new Error(issues.entries.join("\n"))
    }
    return { block, value }
  }

  /** Executes a string compiled within the JavaScript context. */
  evalRaw(text: string): unknown {
    const source = `${this.libJs.getTypeDeclarations()}
;${text}`
    return (0, eval)(source)
  }

  /** Creates a function which can be called repeatedly. */
  compile(
    block: Block,
    value: Value,
    args: string,
  ): (...args: unknown[]) => unknown {
    const runtime = value.toRuntime()
    return this.evalRaw(`
${block.globals.getText()}
;(function(${args}){
${block.source}
;return ${runtime}
})`) as any
  }

  /** Executes a block and value compiled within the JavaScript context. */
  compute(block: Block, value: Value): unknown {
    const runtime = value.toRuntime()
    return this.evalRaw(`
${block.globals.getText()}
${block.source}
;${runtime}`)
  }

  log(script: string, name?: string, locals?: IdMap<Value>) {
    try {
      const { block, value } = this.process(script, name, locals)
      const cooked = this.compute(block, value)
      console.group(`\x1b[30m${script} =\x1b[0m`)
      console.info(
        cooked,
        `\x1b[30m::\x1b[35m`,
        value.type.toString() + "\x1b[0m",
      )
      console.groupEnd()
    } catch (e) {
      console.error(errorText(e))
    }
  }

  lib(lang: Lang): Declarations {
    return lang == "glsl" ? this.libGl : this.libJs
  }

  /** Displays a precomputed value. */
  display(type: Type, value: unknown): string | null {
    if (type == ArrayEmpty) {
      return "[]"
    }

    if (type instanceof FixedArray) {
      if (type.count == 0) {
        return "[]"
      }

      const ret = this.utils.get("display", type.item)
      if (!ret) return null
      return `[${(value as any[]).map((x) => ret.exec(x)).join(",")}]`
    }

    return this.utils.get("display", type)?.exec(value) ?? null
  }
}
