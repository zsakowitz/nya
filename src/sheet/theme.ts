let media: MediaQueryList | undefined

export function isDark() {
  if (!media) {
    media = matchMedia("(prefers-color-scheme: dark)")
  }
  return media.matches
}

export function theme(name: `--${string}`, defaultValue: string): string {
  return getComputedStyle(document.body).getPropertyValue(name) || defaultValue
}

Object.assign(globalThis, { theme })

export function onTheme(cb: () => void) {
  try {
    if (!media) {
      media = matchMedia("(prefers-color-scheme: dark)")
    }
  } catch {}

  if (media) {
    media.addEventListener("change", cb)
  }
}
