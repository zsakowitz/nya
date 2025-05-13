import { writeFileSync } from "fs"
import { parse, parseBlockContents } from "../ast/parse"
import { createStream } from "../ast/stream"
import { Block } from "../emit2/decl"
import { emitBlock, emitItem } from "../emit2/emit"
import { addInspectKeys } from "../emit2/inspect"
import { EmitProps, type Lang } from "../emit2/props"
import { createStdlib } from "../emit2/stdlib"
import { source } from "./source"

function emitGl() {
  const props = new EmitProps("glsl")
  const decl = createStdlib(props)
  let root = []
  let rootTy = []
  for (const item of parse(createStream(source, { comments: false })).items) {
    const result = emitItem(item, decl)
    if (result?.decl) {
      root.push(result.decl)
    }
    if (result?.declTy) {
      rootTy.push(result.declTy)
    }
  }
  const expr = "main"
  const block = new Block(decl)
  const value = emitBlock(
    parseBlockContents(createStream(expr, { comments: false })),
    block,
  )
  const a = [
    decl.globals(),
    root.join("\n"),
    block.source,
    value.toRuntime() + "",
  ]
    .filter((x) => x)
    .join("\n")
  writeFileSync(new URL("./compiled.glsl", import.meta.url), a)
}

function emitJs(lang: Lang) {
  const props = new EmitProps(lang)
  const decl = createStdlib(props)
  let root = []
  let rootTy = []
  for (const item of parse(createStream(source, { comments: false })).items) {
    const result = emitItem(item, decl)
    if (result?.decl) {
      root.push(result.decl)
    }
    if (result?.declTy) {
      rootTy.push(result.declTy)
    }
  }
  const expr = "main"
  const block = new Block(decl)
  const value = emitBlock(
    parseBlockContents(createStream(expr, { comments: false })),
    block,
  )
  const a = [
    decl.globals(),
    root.join("\n"),
    block.source,
    value.toRuntime() + "",
  ]
    .filter((x) => x)
    .join("\n")
  writeFileSync(new URL("./compiled.js", import.meta.url), a)
  console.log((0, eval)(a))
}

addInspectKeys()
try {
  emitJs("js")
  emitGl()
} catch (e) {
  console.error(e)
  console.log(e instanceof Error ? e.message : String(e))
  process.exit(1)
}
