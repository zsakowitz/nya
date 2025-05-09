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
  const context = `
  
  struct complex {re: num, im: num }
  fn +(a: complex, b: complex) -> complex {
  a @+ b
  }
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
  const expr = `@- complex{ re: x, im: 3} `
  const block = new Block(decl)
  const value = emitBlock(
    parseBlockContents(createStream(expr, { comments: false })),
    block,
  )
  console.log(decl.globals())
  console.log(root.join("\n"))
  console.log(block.source)
  console.log(value)
} catch (e) {
  console.error(e)
  console.log(e instanceof Error ? e.message : String(e))
  process.exit(1)
}
