import { CmdBrack } from "./cmd/paren"
import { CmdPm } from "./cmd/token/op/pm"
import { CmdNum } from "./cmd/token/plain/num"
import { Exts, Field } from "./field"
import { Block, L, R } from "./model"

function eq<T>(a: T, b: T) {
  if (a !== b) {
    throw new Error(`${a} should equal ${b}`)
  }
}

function is(x: boolean): asserts x {
  if (!x) {
    throw new Error(`${x} should be true`)
  }
}

function test(name: string, f: () => void) {
  try {
    f()
    console.log(`✅ ${name}`)
  } catch (e) {
    console.error(`❌ ${name} ${e instanceof Error ? e.message : e}`)
  }
}

test("some selection stuff", () => {
  const field = new Field(new Exts().setDefault(CmdNum).set("+", CmdPm))
  field.cursor.moveInside(field.block, L)

  const block = new Block(null)
  new CmdBrack("(", ")", null, block).insertAt(field.cursor, L)
  field.cursor.moveInside(block, L)
  field.type("3")
  field.type("4")
  field.type("9")
  field.type("7")

  const span = field.cursor
    .clone()
    .moveInside(field.cursor.parent!, R)
    .selection()
  span.moveFocus(L)
  span.moveFocus(L)
  span.flip()
  span.moveFocus(L)
  span.each((el) => el.el.classList.add("bg-sky-500"))
  span.remove()

  eq(field.cursor.parent, block)
  is(block.ends[L] instanceof CmdNum)
  eq(block.ends[L].text, "3")
  is(block.ends[L][R] instanceof CmdNum)
  eq(block.ends[L][R].text, "4")
  is(block.ends[L][R][R] instanceof CmdNum)
  eq(block.ends[L][R][R].text, "7")
  eq(block.ends[L][R][R][R], null)
  eq(block.ends[L][R][R][R], block.ends[R])

  is(block.ends[R] instanceof CmdNum)
  eq(block.ends[R].text, "7")
  is(block.ends[R][L] instanceof CmdNum)
  eq(block.ends[R][L].text, "4")
  is(block.ends[R][L][L] instanceof CmdNum)
  eq(block.ends[R][L][L].text, "3")
  eq(block.ends[R][L][L][L], null)
})
