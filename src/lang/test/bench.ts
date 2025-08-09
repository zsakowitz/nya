import { PosVirtual } from "../ast/issue"
import { NyaApi } from "../emit/api"
import { performCall } from "../emit/call"
import { Block, BlockGlobals, Declarations, Exits } from "../emit/decl"
import { ident } from "../emit/id"
import { EmitProps } from "../emit/props"
import { Fn } from "../emit/type"
import { Value } from "../emit/value"

const props = new EmitProps("js")
const lib = new Declarations(
  props,
  null,
  () => null!,
  () => null!,
)
const api = new NyaApi(lib)
const Num = api.scalar("num", "float", true)
const Int = api.scalar("int", "int", true)
api.coercion(
  new Fn(ident("->"), [{ name: "v", type: Int }], Num, ([v]) =>
    v!.unsafeWithType(Num),
  ),
)
api.fmanual("+", { a: Int, b: Int }, Int, ([a, b]) => {
  if (a!.const() && b!.const()) {
    return new Value(((a.value as number) + (b.value as number)) | 0, Int, true)
  } else {
    return new Value(`(${a!.toRuntime()})+(${b!.toRuntime()})|0`, Int, false)
  }
})
api.fmanual("+", { a: Num, b: Num }, Num, ([a, b]) => {
  if (a!.const() && b!.const()) {
    return new Value((a.value as number) + (b.value as number), Num, true)
  } else {
    return new Value(`(${a!.toRuntime()})+(${b!.toRuntime()})`, Num, false)
  }
})

const a = new Value(23, Int, true)
const b = new Value(5.7, Num, true)

const bl = new Block(new BlockGlobals(lib), new Exits(null))
const pos = new PosVirtual("hi")
console.time()
for (let i = 0; i < 1e6; i++) {
  performCall(ident("+"), bl, [a, b], pos, pos)
}
console.timeEnd()

// basic benchmark to compare to new nyalang implementation to make sure we
// don't accidentally ruin performance
