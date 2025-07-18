import type { Package } from "#/types"
import { fa, h, hx, t } from "@/jsx"
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck"
import { faChevronRight } from "@fortawesome/free-solid-svg-icons/faChevronRight"
import { faMinus } from "@fortawesome/free-solid-svg-icons/faMinus"
import { sectionEls } from "./section"

export class PackageList {
  private readonly activePackages = new Set<Package>()
  private readonly fns: (() => void)[] = []

  constructor(readonly packages: Package[]) {
    queueMicrotask(() => this.fns.forEach((x) => x()))
  }

  set(name: Package, active: boolean) {
    if (active == this.activePackages.has(name)) {
      return
    }

    if (active) {
      this.activePackages.add(name)
    } else {
      this.activePackages.delete(name)
    }
    this.fns.forEach((x) => x())
  }

  get count() {
    return this.activePackages.size
  }

  get active() {
    return this.count != 0
  }

  has(name: Package) {
    return this.activePackages.size == 0 || this.activePackages.has(name)
  }

  on(f: () => void) {
    this.fns.push(f)
  }

  with<T>(value: T, f: (value: T) => void): T {
    this.on(() => f(value))
    return value
  }

  section(
    label: string,
    rlabel: () => string,
    disabled: (() => boolean) | null,
    data: Node | (Node | null)[],
    open?: boolean,
  ) {
    const section = sectionEls(label, rlabel(), data, open)
    section.el.ariaDisabled = section.el.dataset.nyaDisabled =
      disabled?.() ? "true" : "false"
    this.on(() => {
      section.rlabel.textContent = rlabel()
      section.el.ariaDisabled = section.el.dataset.nyaDisabled =
        disabled?.() ? "true" : "false"
    })
    return section.el
  }
}

function createCheckbox(onInput: (v: boolean) => void, label: Node) {
  const field = hx("input", { type: "checkbox", class: "sr-only" })
  field.addEventListener("input", () => {
    onInput(field.checked)
  })
  return {
    el: hx(
      "label",
      "flex gap-2 items-center select-none",
      field,
      h(
        "size-4 border border-(--nya-border) rounded-sm flex [:hover+&]:border-(--nya-border-hover) [:checked+&]:bg-(--nya-expr-focus) [:checked+&]:border-transparent [:hover:checked+&]:border-transparent [:indeterminate+&]:bg-(--nya-expr-focus) [:indeterminate+&]:border-transparent [:hover:indeterminate+&]:border-transparent",
        fa(faCheck, "size-3 fill-white m-auto hidden [:checked+*_&]:block"),
        fa(
          faMinus,
          "size-3 fill-white m-auto hidden [:indeterminate+*_&]:block",
        ),
      ),
      label,
    ),
    field,
  }
}

function createCategory(
  list: PackageList,
  labels: boolean,
  category: string,
  packages: Package[],
) {
  const { field, el } = createCheckbox((v) => {
    items.forEach((x) => {
      x.field.checked = v
      list.set(x.pkg, v)
    })
  }, t(category))

  const items = packages.map((pkg) => {
    const cb = createCheckbox(
      (v) => {
        const state =
          items.every((x) => x.field.checked) ? true
          : items.every((x) => !x.field.checked) ? false
          : null

        field.checked = state === true
        field.indeterminate = state == null

        list.set(pkg, v)
      },
      h(
        labels ? "font-semibold" : "",
        pkg.name,
        labels ?
          pkg.label &&
            h("text-(--nya-title-dark) text-sm pl-4 font-normal", pkg.label)
        : null,
      ),
    )
    return { ...cb, pkg }
  })

  const id = "s" + Math.random().toString().slice(2)
  const openCheckbox = hx("input", {
    type: "checkbox",
    class: "sr-only",
    "aria-label": "whether to show all packages in this category",
    id,
  })
  const contents = h("flex flex-col pl-11 hidden", ...items.map((x) => x.el))
  openCheckbox.addEventListener("input", () => {
    contents.classList.toggle("hidden", !openCheckbox.checked)
  })

  return h(
    "flex flex-col",
    h(
      "flex gap-2",
      hx(
        "label",
        "flex items-center",
        openCheckbox,
        fa(
          faChevronRight,
          "size-3 fill-(--nya-dropdown) [:checked+&]:rotate-90",
        ),
      ),
      el,
    ),
    contents,
  )
}

export function secPackagesContents(list: PackageList, labels = true) {
  const raw: Record<string, Package[]> = Object.create(null)
  for (const pkg of list.packages.slice().sort((a, b) =>
    a.name < b.name ? -1
    : a.name > b.name ? 1
    : 0,
  )) {
    ;(raw[pkg.category] ??= []).push(pkg)
  }
  const pkgs = Object.entries(raw)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => createCategory(list, labels, k, v))

  return h("flex flex-col", ...pkgs)
}

export function secPackages(list: PackageList) {
  return list.section(
    "packages",
    () => "" + (list.active ? list.count : list.packages.length),
    null,
    [
      h(
        "-mb-2",
        "Select one or more packages to only show documentation about those packages.",
      ),
      secPackagesContents(list),
    ],
  )
}
