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
  fn +(a: complex, b: complex) -> complex {
  complex{re: a.re + b.re, im: a.im + b.im}
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
  const expr = `complex{ re: 2, im: 3} + complex{re: 4, im: -7}`
  const block = new Block(decl)
  const value = emitBlock(
    parseBlockContents(createStream(expr, { comments: false })),
    block,
  )
  const scalars = value.type.toScalars(value)
  console.timeEnd()
  console.log(scalars)
} catch (e) {
  console.log(e instanceof Error ? e.message : String(e))
  process.exit(1)
}
