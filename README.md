<h1 align="center"><code>nya</code></h1>

project nya is a graphing calculator designed to be extended. It's 100%
open-source (you can look at our code if you want), and adding new features is
as simple as writing and including a single JavaScript file.

**Developing? Try This:** Build the Prettier plugin via `bun build:prettier`,
then run `bun dev` to build the CSS file and start a dev server via esbuild.

# Why choose project nya, as a user?

**Totally new features:**

- Shaders (running an equation for every pixel on your screen)
- Quaternions
- Piecewise functions use multiple lines (type `cases`)
- Lists can optionally span multiple lines (type `list`)
- Ithkuil utilities (parsing and generating text in the language Ithkuil)

**Improvements over Desmos:**

- Cleaner grammar (`sin a cos b`, `[7, 9, 5].mad`, `sec arctan x`, `ln²|x|`)
- Cleaner syntax (automatic spaces after commas, improved spacing around + and -
  signs)
- Fewer restrictions (lists can be >10,000 elements; functions like `stats` can
  be used on multiple lists)
- Includes both geometry tools _and_ complex numbers
- Tells you if a value evaluated to infinity or NaN instead of writing
  `undefined`
- Modern color functions (oklab, oklch)
- Outputs every value in a list[^2]

**Downsides:**

- It doesn't yet have 100% feature compatiability with Desmos.
- It does not yet have as complete support for screen readers.

[^2]:
    This is no longer a unique feature; Desmos has recently added support for
    displaying every element in a list. `nya`'s implementation was still first
    though!

<!-- # Why choose project nya, as a developer?

TODO: write something here -->

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

# Packages

In `nya`, these extensions are called "packages". The [src/pkg/](src/pkg/)
folder has many packages of various complexity, if you'd like to learn by
looking at the code.

Making a package is easy. Just export some variable with the type
[`Package`](src/pkg/index.ts), then called `.load()` on it with
[`SheetFactory`](src/sheet/factory.ts). For a list of the various abilities
packages have, check out the interface signature for `Package`. There's a lot,
and even more options are available through adding new typable commands, AST
nodes and transformers, and [`Ext`](src/sheet/ext/index.ts)s for the graphpaper.

# Repository Structure

All important code is in [src/](src/), which is separated into three components.
Only relatively important files, especially files which need to be edited to add
new extensions, are noted here.

- [src/eval/](src/eval/) evaluates expressions, and defines the AST and type
  system.
  - [ast/](src/eval/ast/) defines the AST and its parser.
    - [token.ts](src/eval/ast/token.ts) defines AST node kinds.
    - [tx.ts](src/eval/ast/tx.ts) defines various methods to evaluate an AST.
  - [ops/](src/eval/ops/) defines operators and functions.
    - [fn/](src/eval/ops/fn/) defines named user-callable functions.
    - [op/](src/eval/ops/op/) defines operators.
    - [index.ts](src/eval/ops/index.ts) provides a list of all operators and
      functions.
  - [ty/](src/eval/ty/) defines the type system.
    - [index.ts](src/eval/ty/index.ts) defines what TypeScript types correspond
      to `nya` types.
    - [info.ts](src/eval/ty/info.ts) defines metadata associated with each type.
- [src/field/](src/field/) defines the math editor and everything which can be
  typed.
  - [cmd/](src/field/cmd/) defines everything which can be rendered and typed in
    a math field.
  - [defaults.ts](src/field/defaults.ts) defines all standard extensions used in
    `nya` math fields.
- [src/sheet/](src/sheet/) draws the graph paper, and defines expression kinds
  (slider, point, etc.).
  - [ext/defaults.ts](src/sheet/ext/defaults.ts) defines all standard extensions
    used in the graph paper.
  - [ext/exts/](src/sheet/ext/exts/) defines extensions which can render
    expressions in the graph paper.

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
