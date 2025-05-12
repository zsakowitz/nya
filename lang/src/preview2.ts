import { writeFileSync } from "fs"
import context from "../examples/test.nya"
import { parse, parseBlockContents } from "./ast/parse"
import { createStream } from "./ast/stream"
import { Block } from "./emit2/decl"
import { emitBlock, emitItem } from "./emit2/emit"
import { addInspectKeys } from "./emit2/inspect"
import { EmitProps } from "./emit2/props"
import { createStdlib } from "./emit2/stdlib"

addInspectKeys()
try {
  const props = new EmitProps("js")
  const decl = createStdlib(props)
  let root = []
  let rootTy = []
  for (const item of parse(createStream(context, { comments: false })).items) {
    const result = emitItem(item, decl)
    if (result?.decl) {
      root.push(result.decl)
    }
    if (result?.declTy) {
      rootTy.push(result.declTy)
    }
  }
  const expr = `
  erf(2+3*i)
  `
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
} catch (e) {
  console.error(e)
  console.log(e instanceof Error ? e.message : String(e))
  process.exit(1)
}
