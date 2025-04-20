It may be useful to create a DSL for writing project nya code.

## Motivation

Many problems exist with the current setup:

1. Functions on real numbers need to work on our `SReal`, JS's `number`, GLSL's
   single-precision `float`, and our custom double-precision `float[2]`.
   Duplication may lead to errors or incomplete implementations.

2. GLSL files rely on other files to exist, but those requirements are not
   specified within the GLSL file itself.

3. Complex numbers and points are a pain, since they rely on ugly method calls
   which even Prettier can't help with.

## Requirements

**P1: Essentials**

- Multiple files
- Compound types
- TypeScript and GLSL output
- Values received from JS data and GLSL uniforms
- Operator overloading
- GLSL textures
- No cycles
- Constant-time loop indices
- Fast compilation
- Generic types (e.g. n-dimensional points)
- List comprehensions
- Arrays with an unknown (but capped) length
- Multi-dimensional arrays

**P2: Developer usability**

- Code formatting
- Syntax highlighting
- Autocomplete
- Errors in IDE
- Automatically watched by esbuild

## Notes

There are no built-in types; everything is defined within nya code itself.

Syntax should be similar-ish to Rust, since it's clear, concise, and will make
sense to many people at first glance.

Identifiers beginning with underscores will be used for operator overloading.
