import { parseBlockContents } from "./ast/parse"
import { createStream } from "./ast/stream"
import { Block } from "./emit2/decl"
import { emitBlock } from "./emit2/emit"
import { EmitProps } from "./emit2/props"
import { createStdlib } from "./emit2/stdlib"

const props = new EmitProps("js")
const stdlib = createStdlib(props)
const source = `sin(2)>sin(3)`
const stream = createStream(source, { comments: false })
const node = parseBlockContents(stream)
const block = new Block(stdlib)
const value = emitBlock(node, block)
console.log(value)
