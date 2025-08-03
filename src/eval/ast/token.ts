export type PuncCmp =
  `cmp-${"" | "n"}${"eq" | "approx" | "tilde" | `${"l" | "g"}t${"e" | ""}`}`

export type PuncInfix =
  | "\\times "
  | "\\odot "
  | "\\otimes "
  | "÷"
  | "\\and "
  | "\\or "
  | "\\uparrow "
  | "\\Rightarrow "
  | "\\to "

export type PuncPm = "+" | "-" | "\\pm " | "\\mp "
