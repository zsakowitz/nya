Since there is not an exact one-to-one relationship between Desmos constructs
and nyalang expressions, some expressions compile using alternative operators or
%-prefixed functions:

| Desmos text    | nyalang equivalent         |
| -------------- | -------------------------- |
| `A B`          | `call * %juxtapose (A, B)` |
| `A \cdot B`    | `call * %dot (A, B)`       |
| `A \times B`   | `call * %cross (A, B)`     |
| `A \odot B`    | `%odot(A, B)`              |
| `\frac A B`    | `call / %frac (A, B)`      |
| `A mod B`      | `call % mod (A, B)`        |
| `\choose A B`  | `%choose(A, B)`            |
| `(A, B, ...)`  | `%point(A, B, ...)`        |
| `\|A\|`        | `call abs %abs(A)`         |
| `\sqrt{A}`     | `%sqrt(A)`                 |
| `sin_A(B)`     | `sin_(A, B)`               |
| `sin_A^3(B)`   | `(sin_(A, B)) ^ 3`         |
| `sin^3 A`      | `(sin(A)) ^ 3`             |
| `sin_A^{-1} B` | `%"sin_^-1"(A, B)`         |
| `sin^{-1} B`   | `%"sin^-1"(A)`             |

Additional functions are also used:

- If an expression evaluates to `v` with type `T` and `fn %display(T) -> latex`
  exists, it is called with `v` and shown as the evaluation result.
- If an expression evaluates to `v` with type `T` and
  `fn %plot(Canvas, T) -> Path` exists, it is called with `v` and plotted onto
  the canvas. The `%plot` function will be recalled every time the canvas moves,
  but `v` will not be recomputed.
