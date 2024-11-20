import { Block, Command, Cursor, L, R } from "../model"

function fail(...data: unknown[]) {
  console.assert(false, ...data)
}

function assert(x: boolean, ...data: unknown[]) {
  if (!x) {
    fail(...data)
  }
}

function assertEq<T>(actual: T, expected: T, ...data: unknown[]) {
  assert(actual === expected, { actual, expected }, ...data)
}

export function checkSanity(el: Block | Command | Cursor | null) {
  if (el instanceof Block) {
  } else if (el instanceof Command) {
    for (let i = 0; i < el.blocks.length; i++) {
      const child = el.blocks[i]!

      assertEq(
        child[L],
        el.blocks[i - 1] || null,
        "Command sub-block does not have the correct `[LHS]` property",
      )

      assertEq(
        child[R],
        el.blocks[i + 1] || null,
        "Command sub-block does not have the correct `[RHS]` property",
      )

      assertEq(
        child.parent,
        el,
        "Command sub-block does not have the correct `.parent` property",
      )
    }
  } else if (el instanceof Cursor) {
    if (el[R]) {
      assertEq(
        el[R].parent,
        el.parent,
        "`cursor.parent` and `cursor[RHS].parent` do not match",
      )
    }

    if (el.parent && el[R]) {
      if (el.parent.ends.indexOf(el[R]) == -1) {
        fail(
          { parent: el.parent, child: el[R] },
          "`cursor.parent` does not contain `cursor[RHS]`",
        )
      }
    }
  }
}
