import { parseBlockContents } from "./ast/parse"
import { createStream } from "./ast/stream"
import { Block } from "./emit2/decl"
import { emitBlock } from "./emit2/emit"
import { ident } from "./emit2/id"
import { addInspectKeys } from "./emit2/inspect"
import { EmitProps } from "./emit2/props"
import { createStdlib } from "./emit2/stdlib"
import { Struct, type Scalar } from "./emit2/type"
import { Value } from "./emit2/value"

addInspectKeys()
const props = new EmitProps("glsl")
const decl = createStdlib(props)
const num = decl.types.get(ident("num")) as Scalar
const bool = decl.types.get(ident("bool")) as Scalar
if (true) {
  const empty = Struct.unify(props, "empty", []).struct
  const result = Struct.unify(props, "world", [
    { name: "void", type: empty },
    { name: "re", type: num },
    { name: "im", type: num },
    // { name: "is_active", type: bool },
  ])
  const accessors = result.struct.generateFieldAccessors(decl)
  const value = result.struct.with([
    empty.with([]),
    new Value(45, num),
    new Value(23, num),
    // new Value(false, bool),
  ])
  console.log(value)
  console.log(accessors?.map((x) => x.run([value])))
} else {
  const source = `is_inf(x)+y`
  const stream = createStream(source, { comments: false })
  const node = parseBlockContents(stream)
  const block = new Block(decl)
  const value = emitBlock(node, block)
  console.log(decl.globals())
  console.log(value)
}
