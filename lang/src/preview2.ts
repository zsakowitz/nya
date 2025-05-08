import { parse, parseBlockContents } from "./ast/parse"
import { createStream } from "./ast/stream"
import { Block } from "./emit2/decl"
import { emitBlock, emitItem } from "./emit2/emit"
import { addInspectKeys } from "./emit2/inspect"
import { EmitProps } from "./emit2/props"
import { createStdlib } from "./emit2/stdlib"

addInspectKeys()
try {
  console.time()
  const props = new EmitProps("glsl")
  const decl = createStdlib(props)
  const context = `
  
  struct complex {re: num, im: num }
  `
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
  const expr = `complex{ re: 2, im: 3}`
  const block = new Block(decl)
  const value = emitBlock(
    parseBlockContents(createStream(expr, { comments: false })),
    block,
  )
  console.timeEnd()
  console.log(value)
} catch (e) {
  console.log(e instanceof Error ? e.message : String(e))
  process.exit(1)
}
