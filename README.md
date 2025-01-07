<h1 align="center"><code></code></h1>

Named after the Ithkuil root for writing, inscribing, and documenting[^1], `` is
a replacement for the venerable [MathQuill](https://mathquill.com/) project,
which aimed to provide a clean and intuitive way to type math into webpages.

`` differs from MathQuill in a few positive aspects:

- `` is built to be extended.
- `` has first-class matrix and piecewise support.
- `` has first-class multi-line expression support.

There are also the downsides of ``:

- `` will not support sub-ES5 targets.
- `` will not support IE.
- `` does not yet support all of LaTeX.
- `` does not yet have as much support for screen readers.

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
