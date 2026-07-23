# Effects: a convention, not a type (CRITIQUE §4.3)

## Status

**Decided: effects are tracked by convention, not by the type system.** mochi's
HM core stays pure-by-omission — there is no effect row, no `IO`/`Task` marker
that inference enforces. This is a deliberate, recorded choice, not an oversight.

## What that means

Nothing in a type distinguishes an effectful value from a pure one. A function
that reads the clock and one that doubles a number can share the type
`number -> number`. Effects enter **only** at the `extern` boundary — that is the
one place a side effect can cross into an mochi program, because everything the
compiler emits is pure data-shuffling over the values externs hand it.

The discipline that keeps this honest:

- An `extern` whose JS body performs a side effect (I/O, mutation, randomness,
  the network) **should** be typed to return a `Task a` (a lazy `() => Promise`),
  never a bare value. A `Task` is inert until `run` hands it to the host, so the
  effect is deferred to the program edge — see `examples/async/`.
- Pure host functions (`Math.hypot`, string ops) return their value directly.

```mochi
extern now    : Unit -> Task number = "host" "now"      // effectful → Task
extern sqrt   : number -> number     = "Math" "sqrt"     // pure → bare value
```

## Why not enforce it

Retrofitting effect tracking into a plain-HM core is expensive, and it is far
cheaper to *not* have it than to rip it out later. The two mechanical options
were both rejected for now:

- **Effect rows** (Koka-style `a ->{io} b`). The row-unification engine already
  exists (records use it), so the hard part is built — but an effect annotation
  then infects *every* function signature, doubling the cognitive surface. That
  is a research-grade commitment worth making only if effects become mochi's
  thesis. They are not, today.
- **A mechanical FFI lint** ("an effectful extern must return `Task`/`IO`"). This
  is the appealing middle ground the critique floats, but it is **not decidable
  from the mochi side**: the compiler cannot inspect a JS export's body to know
  whether it is effectful. The rule can only ever be author discipline, so it
  lives here as documentation rather than as a false-confidence checker.

## If this ever needs to change

The row engine is the migration path. Because effects are confined to `extern`
signatures today, a future effect system would start by classifying externs and
propagating outward — the pure interior would not need re-annotation. Deciding
early that we *care* is the point of this note; the machinery can wait.

## Related

- Monadic sequencing sugar (`do`/`use`-style blocks over `Task`/`Result`) is a
  separate, orthogonal ergonomics question. It does not track purity — it just
  makes the convention pleasant enough that nobody reaches for a hidden effect.
  Not yet scoped.
