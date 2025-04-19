## To Do

- Statistics
- Functions
- Matrices
- Tetration
- Folders
- Units

## Representing Known Accuracy of Values

**Idea:** Report computed values to the correct amount of decimal places.

**How:** Each number stores extra information representing its accuracy. All
operations return a new accuracy along with their value. Accuracy is roughly
"what is the smallest power of 10 we have an accurate value for".

Conceptually, approximately speaking, a value `v` with accuracy `a` could be
anything between `v - 10^a/2` and `v + 10^a/2`.

A specification of operations and their accuracies, where ~a means "the accuracy
of a"

```
expression  accuracy            explanation (if non-obvious)

2           0
2.3         -1
2.34        -2
2.00        -2

a + b       max(~a, ~b)         pick the less precise accuracy
a - b       max(~a, ~b)         pick the less precise accuracy
a * b       ~a + ~b             multiplication combines accuracies
a ÷ b       ~a - ~b             division combines accuracies
a ^ b
```

## Specialized Folders

Add various kinds of folders with specialized functionality.

### Scoped Folders

The goals for scoped folders are:

1. To preserve compatiability with Desmos.
2. To enable folders to redefine variables.

The algorithm for name resolution is thus:

```
fn lookup(name, scope):
  if there is one definition of `name` in `scope`:
    return that definition
  if there are multiple definitions of `name` in `scope`:
    throw an error for ambiguity
  if there is a definition of `name` in `scope.parent`:

```

All folders create a **scope** around their contents. The folder or root
containing them is known as their **parent scope**, and any folders they contain
are known as **child scopes**.

The rough idea for name resolution is thus that scopes may access variables they
define, variables defined in a parent scope, and variables defined in child
scopes.

When looking up a name `name`, these modified rules are used:

1. If `name` is defined exactly once in this scope, use that definition.
2. Else, look up `name` in all child scopes and in the parent scope.

Here is an example:

```
(root)
f(x) = x^2
g(x) = sin x
f(7) // outputs 49
[folder] hello world
  f(x) = x^3
  f(7) // outputs 343
  h(x) = x^7
  g(78) // ambiguous, and results in an error
  [folder] folder 1
    g(x) = 78
  [folder] folder 2
    g(x) = 89
h(7) = 823543 // able to access h(x) from folder
```

## Module System

Allow folders to be declared as
