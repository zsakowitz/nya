import { SCRIPTS, type ScriptName } from "#/script-index"
import { ScriptEnvironment } from "../lang/src/exec/loader"

if (await checkEach()) {
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

  if (ok) {
    console.log(
      `✅ ${SCRIPTS.size} scripts checked individually with no errors!`,
    )
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
