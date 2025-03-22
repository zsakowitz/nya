import { fa } from "@/field/fa"
import { h, hx } from "@/jsx"
import type { Package } from "@/pkg"
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck"
import { sectionEls } from "./section"

export class PackageList {
  private readonly activePackages = new Set<string>()
  private readonly fns: (() => void)[] = []

  constructor(readonly packages: Package[]) {
    queueMicrotask(() => this.fns.forEach((x) => x()))
  }

  set(name: string, active: boolean) {
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

  has(name: string) {
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

export function secPackagesContents(list: PackageList, labels = true) {
  return h(
    "flex flex-col",
    ...list.packages
      .sort((a, b) =>
        a.name < b.name ? -1
        : a.name > b.name ? 1
        : a.id < b.id ? -1
        : a.id > b.id ? 1
        : 0,
      )
      .map((pkg) => {
        const field = hx("input", {
          type: "checkbox",
          class: "sr-only",
          autocomplete: "off",
        })
        field.addEventListener("input", () => {
          list.set(pkg.id, field.checked)
        })
        return hx(
          "label",
          "flex gap-2 items-center select-none",
          field,
          h(
            "size-4 border border-[--nya-border] rounded [:checked+&]:bg-[--nya-expr-focus] [:checked+&]:border-transparent flex [:hover+&]:border-[--nya-border-hover] [:hover:checked+&]:border-transparent",
            fa(
              faCheck,
              "size-3 fill-current m-auto hidden [:checked+*_&]:block",
            ),
          ),
          h(
            labels ? "font-semibold" : "",
            pkg.name,
            labels ?
              pkg.label &&
                h("text-[--nya-title-dark] text-sm pl-4 font-normal", pkg.label)
            : null,
          ),
        )
      }),
  )
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
