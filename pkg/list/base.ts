import { example } from "@/docs/core"
import { Precedence } from "@/eval/ast/token"
import { NO_DRAG, NO_SYM } from "@/eval/ast/tx"
import { glsl } from "@/eval/glsl"
import { js } from "@/eval/js"
import { asNumericBase } from "@/eval/lib/base"
import { real } from "@/eval/ty/create"
import { b, px } from "@/jsx"
import type { Package } from "#/types"

// TODO: tons of base functionality is available without this package
// removing subscripts on numbers would fix it, but may be annoying

export const PKG_BASE: Package = {
  id: "nya:base",
  name: "alternate bases",
  label: "bases other than 2*5",
  category: "number theory",
  eval: {
    tx: {
      binary: {
        base: {
          precedence: Precedence.WordInfix,
          sym: NO_SYM,
          deps(node, deps) {
            deps.add(node.lhs)
            deps.add(node.rhs)
          },
          drag: NO_DRAG,
          js({ lhs, rhs }, props) {
            return js(
              lhs,
              Object.create(props, {
                base: {
                  value:
                    (
                      rhs.type == "var" &&
                      rhs.kind == "var" &&
                      !rhs.sub &&
                      !rhs.sup &&
                      (rhs.value == "mrrp" || rhs.value == "meow")
                    ) ?
                      real(10)
                    : asNumericBase(
                        js(
                          rhs,
                          Object.create(props, {
                            base: { value: real(10) },
                          }),
                        ),
                      ),
                },
              }),
            )
          },
          glsl({ lhs, rhs }, props) {
            return glsl(
              lhs,
              Object.create(props, {
                base: {
                  value:
                    (
                      rhs.type == "var" &&
                      rhs.kind == "var" &&
                      !rhs.sub &&
                      !rhs.sup &&
                      (rhs.value == "mrrp" || rhs.value == "meow")
                    ) ?
                      real(10)
                    : asNumericBase(
                        js(
                          rhs,
                          Object.create(props, {
                            base: { value: real(10) },
                          }),
                        ),
                      ),
                },
              }),
            )
          },
        },
      },
    },
  },
  docs: [
    {
      name: "alternate bases",
      poster: "1001+1101base2",
      render() {
        return [
          px`The ${b("base")} operator lets you write numbers in alternate number bases, like binary, hexadecimal, or even base -π!`,
          example("1001+1101base2", "=10110base2"),
          px`To convert between bases, write two ${b("base")} clauses.`,
          example("1001+1101base2base5", "=42base5"),
          px`To output something in decimal, convert the result into base ten. Otherwise, project nya will try to guess what base you want to output in.`,
          example("1001+1101base2base10", "=22"),
        ]
      },
    },
  ],
}
