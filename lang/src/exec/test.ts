import type { Data } from "@/eval2/node"
import { ParseNode } from "@/eval2/parse"
import "@/eval2/txs"
import { Entry, EntrySet } from "./item"

const set = new EntrySet()
const e1 = new Entry(set)
const e2 = new Entry(set)
const e3 = new Entry(set)
const e4 = new Entry(set)
e1.setTo(
  new ParseNode<Data>({ type: "op", data: "*" }, [
    new ParseNode<Data>({ type: "num", data: "23" }, null),
    new ParseNode<Data>({ type: "uvar", data: { name: "i", sub: null } }, null),
  ]),
  true,
)
e2.setTo(
  new ParseNode<Data>(
    {
      type: "binding",
      data: { name: { name: "a", sub: null }, args: null },
    },
    [
      new ParseNode<Data>({ type: "op", data: "*" }, [
        new ParseNode<Data>({ type: "num", data: "45" }, null),
        new ParseNode<Data>(
          { type: "uvar", data: { name: "k", sub: null } },
          null,
        ),
      ]),
    ],
  ),
  true,
)
await set.update()
console.log(e2.exe)
