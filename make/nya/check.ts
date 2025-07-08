import { ident } from "!/emit/id"
import { Alt } from "!/emit/type"
import { ScriptEnvironment } from "!/exec/loader"
import { SCRIPTS, type ScriptName } from "#/script-index"
import { SCRIPT_NAMES } from "#/scripts"
import { errorText } from "@/error"

console.log("checking each")
if (checkEach()) {
  console.log("checking fn")
  checkFn()
  console.log("checking all")
  checkAll(10)
}

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

  console.log(`✅ ${SCRIPTS.size} scripts checked individually with no errors!`)
  return true
}

function checkFn() {
  try {
    const scripts = Array.from(SCRIPTS.keys())
    shuffleArray(scripts)
    // decreases risk of order-dependent errors
    var env = new ScriptEnvironment()
    for (const k of scripts) {
      env.load(k as ScriptName)
    }
  } catch (e) {
    console.error(errorText(e))
    process.exitCode = 1
    return false
  }

  const fnDisplay = env.libJs.fns.get(ident("%display"))
  if (!fnDisplay) {
    console.log(`❌ No %display impls found.`)
    return false
  }
  const tys = env.libJs.types.all()
  let ok = false
  let count = 0
  const noDisplay = []
  for (const [, ty] of tys) {
    if (ty.toString().startsWith("_") || ty instanceof Alt) {
      continue
    }
    count++
    const fDisplay = fnDisplay.find(
      (x) => x.args.length == 1 && x.args[0]!.type.canConvertFrom(ty),
    )
    if (fDisplay) {
      if (fDisplay.ret != env.libJs.tyLatex) {
        console.error(
          `\x1b[36m${ty}\x1b[30m: \x1b[31m%display does not return formatted LaTeX.`,
        )
        ok = false
      }
    } else {
      noDisplay.push(ty.toString())
      ok = false
    }
  }
  if (noDisplay.length) {
    console.error(
      `\x1b[31mmissing %display (${noDisplay.length})\x1b[30m: \x1b[36m${noDisplay.join("\x1b[30m, \x1b[36m")}`,
    )
  }
  if (ok) {
    console.log(`✅ ${count} types all have %display impls!`)
  } else {
    process.exitCode = 1
  }

  return ok
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
      `✅ ${SCRIPTS.size} scripts loaded together in ${count} different orders with no errors!`,
    )
  } else {
    process.exitCode = 1
  }

  return ok
}
