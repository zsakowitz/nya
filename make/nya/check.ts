import { suppressesOverload } from "!/emit/coerce"
import type { Fn } from "!/emit/type"
import { ScriptEnvironment } from "!/exec/loader"
import { SCRIPTS, type ScriptName } from "#/script-index"
import { SCRIPT_NAMES } from "#/scripts"
import { errorText } from "@/error"
import { ANSI } from "./ansi"

checkEach() && checkAll(10) && checkOverloads()

/*! https://stackoverflow.com/a/12646864 */
function shuffleArray(array: unknown[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

function checkEach() {
  let ok = true

  // from error to source package
  const errors = new Map<string, string[]>()
  for (const key of SCRIPT_NAMES) {
    try {
      const env = new ScriptEnvironment()
      env.load(key as ScriptName)
    } catch (e) {
      ok = false
      const msg = errorText(e)
      errors.get(msg)?.push(key) ?? errors.set(msg, [key])
      process.exitCode = 1
    }
  }

  for (const [e, key] of errors) {
    console.error(
      `\x1b[30min \x1b[36m${key[0]}\x1b[30m${key.length > 1 ? "+" + (key.length - 1) : ""}: \x1b[31m${e}`,
    )
  }

  if (!ok) {
    process.exitCode = 1
    return false
  }

  console.log(`✅ ${SCRIPTS.size} scripts checked individually with no errors`)
  return true
}

function checkOverloads() {
  let env

  try {
    const scripts = Array.from(SCRIPTS.keys())
    shuffleArray(scripts)
    // decreases risk of order-dependent errors
    env = new ScriptEnvironment()
    for (const k of scripts) {
      env.load(k as ScriptName)
    }
  } catch (e) {
    console.error(errorText(e))
    process.exitCode = 1
    return false
  }

  const suppressed: { earlier: Fn[]; later: Fn }[] = []

  for (const fn of env.libJs.fns.all()) {
    if (!fn.length) continue

    nextFn: for (let i = 1; i < fn.length; i++) {
      const later = fn[i]!

      const suppressors = fn.slice(0, i).filter(
        (earlier) =>
          later.args.length == earlier.args.length &&
          suppressesOverload(
            env.libJs.coercions,
            earlier.args.map((x) => x.type),
            later.args.map((x) => x.type),
          ),
      )
      if (suppressors.length) {
        suppressed.push({ earlier: suppressors, later })
      }
    }
  }

  if (suppressed.length) {
    console.log(
      `❌ ${suppressed.length} function overload${suppressed.length == 1 ? " is" : "s are"} shadowed:`,
    )
    for (const el of suppressed.slice(0, 10)) {
      const head = `  ${ANSI.magenta}${el.later} ${ANSI.reset}@ ${ANSI.cyan}${el.later.pos ?? "<std>"}`
      const tail = el.earlier.map(
        (x, i, a) =>
          `\n    ${ANSI.reset}${ANSI.dim}${
            i == 0 ?
              a.length > 1 ?
                "by "
              : "by"
            : "and"
          } ${ANSI.blue}${x} ${ANSI.reset}${ANSI.dim}@ ${ANSI.cyan}${x.pos ?? "<std>"}${ANSI.reset}`,
      )
      console.log(head + tail.join(""))
    }

    process.exitCode = 1
    return false
  }

  const count = env.libJs.fns.all().reduce((a, b) => a + b.length, 0)

  console.log(`✅ ${count} function overloads are all accessible!`)
}

function checkAll(count: number) {
  let ok = true

  for (let i = 0; i < count; i++) {
    try {
      const scripts = Array.from(SCRIPTS.keys())
      shuffleArray(scripts)
      // decreases risk of order-dependent errors
      const env = new ScriptEnvironment()
      for (const k of scripts) {
        env.load(k as ScriptName)
      }
    } catch (e) {
      console.error(errorText(e))
      process.exitCode = 1
      ok = false
    }
  }

  if (ok) {
    console.log(
      `✅ ${SCRIPTS.size} scripts loaded together in ${count} different orders with no errors`,
    )
  } else {
    process.exitCode = 1
  }

  return ok
}
