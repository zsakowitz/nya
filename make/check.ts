import { SCRIPTS, type ScriptName } from "#/script-index"
import { ident } from "../lang/src/emit/id"
import { ScriptEnvironment } from "../lang/src/exec/loader"

if (await checkEach()) {
  await checkFn()
  await checkAll(10)
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

async function checkEach() {
  let ok = true

  await Promise.all(
    [...SCRIPTS.keys()].map(async (key) => {
      try {
        const env = new ScriptEnvironment()
        await env.load(key as ScriptName)
      } catch (e) {
        ok = false
        console.error(
          `\x1b[30min \x1b[36m${key}\x1b[30m: \x1b[31m${e instanceof Error ? e.message : String(e)}`,
        )
        process.exitCode = 1
      }
    }),
  )

  if (!ok) {
    process.exitCode = 1
    return false
  }

  console.log(`✅ ${SCRIPTS.size} scripts checked individually with no errors!`)
  return true
}

async function checkFn() {
  try {
    const scripts = Array.from(SCRIPTS.keys())
    shuffleArray(scripts)
    // decreases risk of order-dependent errors
    var env = new ScriptEnvironment()
    for (const k of scripts) {
      await env.load(k as ScriptName)
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exitCode = 1
    return false
  }

  const fnDisplay = env.libJs.fns.get(ident("%display"))
  const fnDebug = env.libJs.fns.get(ident("%debug"))
  if (!fnDisplay || !fnDebug) {
    console.log(`❌ No %display or %debug impls found.`)
    return false
  }
  const tys = env.libJs.types.all()
  let ok = false
  for (const [, ty] of tys) {
    if (ty.toString().startsWith("_")) {
      continue
    }
    const fDisplay = fnDisplay.find(
      (x) => x.args.length == 1 && x.args[0]!.type.canConvertFrom(ty),
    )
    const fDebug = fnDebug.find(
      (x) => x.args.length == 1 && x.args[0]!.type.canConvertFrom(ty),
    )
    const e1 =
      fDisplay ?
        fDisplay.ret == env.libJs.tyLatex ?
          null
        : `%display returns ${fDisplay.ret}`
      : `no %display`
    const e2 =
      fDebug ?
        fDebug.ret == env.libJs.tyLatex ?
          null
        : `%debug returns ${fDebug.ret}`
      : `no %debug`
    if (e1 || e2) {
      ok = false
      console.error(
        `\x1b[36m${ty}\x1b[30m: \x1b[31m${e1 && e2 ? e1 + "; " + e2 : e1 || e2}`,
      )
    }
  }

  if (ok) {
    console.log(`✅ ${tys.length} types all have %display and %debug impls!`)
  } else {
    process.exitCode = 1
  }

  return ok
}

async function checkAll(count: number) {
  let ok = true

  await Promise.all(
    Array.from({ length: count }, async () => {
      try {
        const scripts = Array.from(SCRIPTS.keys())
        shuffleArray(scripts)
        // decreases risk of order-dependent errors
        const env = new ScriptEnvironment()
        for (const k of scripts) {
          await env.load(k as ScriptName)
        }
      } catch (e) {
        console.error(e instanceof Error ? e.message : String(e))
        process.exitCode = 1
        ok = false
      }
    }),
  )

  if (ok) {
    console.log(
      `✅ ${SCRIPTS.size} scripts loaded together in ${count} different orders with no errors!`,
    )
  } else {
    process.exitCode = 1
  }

  return ok
}
