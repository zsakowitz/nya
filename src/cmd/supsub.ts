import { U_ZERO_WIDTH_SPACE, h, t } from "../jsx"
import { Block, Command, L, R, type Cursor, type Dir } from "../model"

export class CmdSubSup extends Command {
  static init(cursor: Cursor, input: string) {
    if (input == "^") {
      const prev = cursor[L]
      if (prev instanceof CmdSubSup) {
        cursor.moveIn(prev.create("sup"), R)
        return
      }

      const block = new Block(null)
      new CmdSubSup(null, block).insertAt(cursor, L)
      cursor.moveIn(block, R)
    } else if (input == "_") {
      const prev = cursor[L]
      if (prev instanceof CmdSubSup) {
        cursor.moveIn(prev.create("sub"), R)
        return
      }

      const block = new Block(null)
      new CmdSubSup(block, null).insertAt(cursor, L)
      cursor.moveIn(block, R)
    }
  }

  constructor(
    readonly sub: Block | null,
    readonly sup: Block | null,
  ) {
    super(
      sub ? "_" : "^",
      CmdSubSup.html(sub, sup),
      [sub, sup].filter((x) => x != null),
    )
  }

  ascii(): string {
    return (
      (this.sub ? `_(${this.sub.ascii()})` : "") +
      (this.sup ? `^(${this.sup.ascii()})` : "")
    )
  }

  latex(): string {
    return (
      (this.sub ? `_{${this.sub.latex()}}` : "") +
      (this.sup ? `^{${this.sup.latex()}}` : "")
    )
  }

  reader(): string {
    return (
      (this.sub ? `Sub ${this.sub.reader()} EndSub` : "") +
      (this.sup ? `Sup ${this.sup.reader()} EndSup` : "")
    )
  }

  static html(sub: Block | null, sup: Block | null) {
    if (sup && !sub) {
      return h(
        "mb-[-.2em] inline-block text-left align-[.5em] text-[90%]",
        h("inline-block align-text-bottom", sup.el),
      )
    } else if (sub && !sup) {
      return h(
        "mb-[-.2em] inline-block text-left align-[-.5em] text-[90%]",
        h("float-left block text-[80%]", sub.el),
        h("inline-block w-0", t(U_ZERO_WIDTH_SPACE)),
      )
    } else if (sub && sup) {
      return h(
        "mb-[-.2em] inline-block text-left align-[-.5em] text-[90%]",
        h("block", sup.el),
        h("float-left block text-[80%]", sub.el),
        h("inline-block w-0", t(U_ZERO_WIDTH_SPACE)),
      )
    } else {
      return h()
    }
  }

  /** Creates the given part, or returns the block if it already exists. */
  create(part: "sub" | "sup") {
    if (!this[part]) {
      ;(this as any)[part] = new Block(this)
      const next = CmdSubSup.html(this.sub, this.sup)
      this.el.replaceWith(next)
      ;(this as any).el = next
    }
    return this[part]!
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    if (this.sup) {
      cursor.moveIn(this.sup, towards == L ? R : L)
    } else {
      cursor.moveTo(this, towards)
    }
  }

  moveOutOf(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards)
  }
}

// function hi() {
//   switch (0) {
//     case "sub":
//       return (
//         <span
//           class="mb-[-.2em] inline-block text-left align-[-.5em] text-[90%]"
//           classList={{ "pr-[.2em]": symbol.spaceAfter }}
//         >
//           <span class="float-left block text-[80%]">
//             <SymbolList
//               symbols={symbol.contents}
//               replaceSelf={(symbols, data) =>
//                 replaceSelf([{ type: "sub", contents: symbols }], data)
//               }
//             />
//           </span>
//
//           <span class="inline-block w-0">​</span>
//         </span>
//       )
//     case "supsub":
//       return (
//         <span
//           class="mb-[-.2em] inline-block text-left align-[-.5em] text-[90%]"
//           classList={{ "pr-[.2em]": symbol.spaceAfter }}
//         >
//           <span class="block">
//             <SymbolList
//               symbols={symbol.sup}
//               replaceSelf={(symbols, data) =>
//                 replaceSelf(
//                   [
//                     {
//                       type: "supsub",
//                       sup: symbols,
//                       sub: prepareSymbolList(symbol.sub, data),
//                     },
//                   ],
//                   data,
//                 )
//               }
//             />
//           </span>
//
//           <span class="float-left block text-[80%]">
//             <SymbolList
//               symbols={symbol.sub}
//               replaceSelf={(symbols, data) =>
//                 replaceSelf(
//                   [
//                     {
//                       type: "supsub",
//                       sub: symbols,
//                       sup: prepareSymbolList(symbol.sup, data),
//                     },
//                   ],
//                   data,
//                 )
//               }
//             />
//           </span>
//
//           <span class="inline-block w-0">​​</span>
//         </span>
//       )
//     case "sup":
//       return (
//         <span
//           class="mb-[-.2em] inline-block text-left align-[.5em] text-[90%]"
//           classList={{ "pr-[.2em]": symbol.spaceAfter }}
//         >
//           <span class="inline-block align-text-bottom">
//             <SymbolList
//               symbols={symbol.contents}
//               replaceSelf={(symbols, data) =>
//                 replaceSelf([{ type: "sup", contents: symbols }], data)
//               }
//             />
//           </span>
//         </span>
//       )
//   }
// }
