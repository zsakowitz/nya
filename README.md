<h1 align="center"><code>nya</code></h1>

Named after the Ithkuil root for writing, inscribing, and documenting[^1], `nya`
is a replacement for the venerable [MathQuill](https://mathquill.com/) project,
which aimed to provide a clean and intuitive way to type math into webpages.

`nya` differs from MathQuill in a few positive aspects:

- `nya` is built to be extended.
- `nya` has first-class matrix and piecewise support.
- `nya` has first-class multi-line expression support.

There are also the downsides of `nya`:

- `nya` will not support sub-ES5 targets.
- `nya` will not support IE.
- `nya` does not yet support all of LaTeX.
- `nya` does not yet have as much support for screen readers.

# Extensibility

`nya` follows the principle of “everything is an extension”. The very core of
`nya` is hardcoded, but these things are all easily extensible and replaceable:

- what the user can type
- which LaTeX commands can be parsed
- the expression AST
- every operator
- every function
- the type system
- what an expression in a graph sheet does
- how values are displayed as text
- how values are rendered to the canvas
- how values are dragged

Some example of extensions which can easily be incorporated into `nya`'s model:

- An extension which allows symbolic algebra to be computed by acting as a proxy
  for WolframAlpha.
- An extension which provides octonion support (8-dimensional numbers) and
  overloads all built-in operators to work on octonions.
- An extension which allows a graph expression to evaluate to a video which is
  them streamed live to social media.
- An extension which allows slider values to be taken from the orientation of
  the device.

In the future, it's hoped that arbitrary extensions will be loadable directly
from the graph paper. Since this poses possible security risks, it isn't
available yet.

# Repository Structure

All important code is in [src/](src/), which is separated into three components.
Only important files are described here.

- [src/eval/](src/eval/) evaluates expressions, and defines the AST and type
  system.
  - [src/eval/ast/](src/eval/ast/) defines the AST and its parser.
    - [src/eval/ast/token.ts](src/eval/ast/token.ts) defines AST node kinds.
  - [src/eval/ops/](src/eval/ops/) defines operators and functions.
    - [src/eval/ops/fn/](src/eval/ops/fn/) defines named user-callable
      functions.
    - [src/eval/ops/op/](src/eval/ops/op/) defines operators.
    - [src/eval/ops/index.ts](src/eval/ops/index.ts) provides a list of all
      operators and functions.
  - [src/eval/ty/](src/eval/ty/) defines the type system.
    - [src/eval/ty/index.ts](src/eval/ty/index.ts) defines what TypeScript types
      correspond to `nya` types.
    - [src/eval/ty/info.ts](src/eval/ty/info.ts) defines lots of metadata
      associated with each type.
- [src/field/](src/field/) defines the math editor and everything which can be
  typed.
- [src/sheet/](src/sheet/) draws the graph paper, and defines expression kinds
  (slider, point, etc.).

# The Editor

## High-level overview

- Every number, variable, and `\\sqrt` is a **command**.
- A command contains sub-fields (called **blocks**).
- A **block** is a row of **commands**.

Modifying at a point:

- A **cursor** is like a normal cursor.
- Deletions and insertions can be done on the **cursor**.
- Those can be done on blocks directly, but it is somewhat unsafe.

Modifying a range:

- A **span** is a range of **commands**.
- A **span** can be removed from its containing block (all commands are
  contained by some block).
- A **selection** is a span with a focus node. Think: normal computer selection.

## Low-level details

The data model is basically a virtual DOM, albeit one with many changes:

- Instead of `Command` arrays for children, children are stored in `Block`s,
  with a single `Command` owning zero or more `Block`s.
- Instead of direct `.insertNode()` operations, many operations are done using
  `Cursor`s or `Span`s as proxies.
- Instead of handling all edge cases, the model relies on the programmer not to
  make many mistakes.

The [`src/field/model.ts`](src/field/model.ts) file defines the entire data
model, if you want to look at the source instead. It's in a single file split
into many classes and interfaces, as all the implementation details are highly
coupled together.

Note that many properties in the model are declared `readonly`. This is to
prevent external code from changing it inadvertently. However, many of these
properties will change throughout the program's lifetime. Think of them more as
DOM accessors like `.nextSibling` rather than as read-only data.

More useful details:

- A `Cursor` is defined by 1) the `Block` which contains it and 2) the `Command`
  to its right.
- A `Span` is defined by 1) the `Block` which contains it and 2) the `Command`s
  on either side.
- A `Selection` is a `Span` where one side is designated as the focused side.
- A `Command` contains references to 1) its child `Block`s, 2) the `Command`s on
  either side, and 3) its containing `Block`.
- A `Block` contains references to 1) its parent `Command` and 2) the left- and
  rightmost `Command`s it contains.

### Data invalidation

The easiest error to make is data invalidation. This happens if an object's
references are no longer consistent, such as if:

- A `Cursor`'s `Command` does not have the same parent as the `Cursor` itself.
- A `Cursor`'s `Command` references the same parent as the `Cursor`, but has
  been removed from said parent.

If you are planning to replace or remove a `Command`, it is safest to ensure the
`Cursor` is not attached to said `Command`. Simply call
`cursor.moveTo(command, R)` to do this.

# The LaTeX Parser

A future component of this project.

# The JS/GLSL Emitter

A future component of this project.

# The Graphing Software

A future component of this project.

[^1]:
    The root in question being `ň`, pronounced like the `ng` in `-ing`.
    Technically `nga` would be a more accurate name, but it isn't as fun.
