# 0145 — Structural ordering for records and variants

- **Status:** Accepted
- **Date:** 2026-10-03
- **Source:** issues #163 and #178
- **Amends:** ADR 0084's ordering walk; updates ADR 0138's proposed eligibility scope.

## Context

The record/variant fallback compared JSON text. Field insertion order affected
ordering, numbers were ordered as text, and JSON omission collapsed distinct
own-key sets. It also invoked host toJSON hooks and serialized nested lazy Lists.

## Decision

Compare records recursively, visiting own enumerable string keys in lexical
order. Compare each key before its value, then compare lengths when one key
sequence is a prefix. Missing keys and explicitly undefined values stay distinct.
Inherited, hidden and symbol keys do not participate, matching record equality.

An own enumerable string `_tag` identifies the runtime variant shape. Tagged
objects sort before untagged records; compare their tags before their payloads.
Canonical positional keys (`_0`, `_1`, ... without leading zeros) sort by numeric
index, before named keys, which sort lexically. This includes host tagged records:
the runtime cannot distinguish a variant from a record with that representation.
Read each tag once per visited object. Other values are read only as traversal
reaches them. Do not call toJSON or cache mutable host objects' key lists.

For optional host fields, order undefined before null before populated values.
Other primitive, Array, Map and Set paths retain their existing comparison rules;
record payloads reached through those paths now use the structural walk. Native
Map/Set equality retains identity keys. Comparison of collections is not a test
for identity-keyed equality.

This is not a universal total order. NaN retains the existing comparison result
of zero against numbers; signed zeros compare equally. Functions, symbols,
bigints, heterogeneous host types, opaque class instances, cycles and effectful
getters have no supported structural ordering contract. Distinct non-object
values reaching the fallback return zero. Class instances are viewed through
enumerable fields rather than toJSON. Callers should compare a safe projection
for opaque values. Pure finite same-schema records/variants over supported
primitives and eager arrays satisfy ordering laws and equality agreement.

Traversal that reaches a distinct lazy List throws the existing explicit
unsupported-operation error without pulling it. Identity shortcuts or earlier
differences can avoid reaching a List. Both operands are checked. Static safety
constraints remain proposed in ADR 0138; this decision does not implement them.

The runtime TypeScript remains the authored source (ADR 0075). Generate JS
definitions, the prelude shim and frozen seed through repository scripts.
JSON escaping in show remains intentional.

## Costs and validation

Visiting a record with k fields sorts two key arrays: O(k log k), plus recursive
comparison of reached values. There is no serialized copy of the entire value.
Sorting an Array still requires O(n log n) comparisons, with value traversal
costs dependent on the input. No allocation-free or universal speedup claim.

Runtime regressions cover numeric fields, insertion order, key presence,
nullish fields, tag precedence, positional/named payloads, prototypes, toJSON
and lazy Lists. Property tests cover antisymmetry, transitivity, equality
agreement and insertion-order invariance over finite same-schema values.
Compiled-language sorting and strict TypeScript guards exercise both backends.
The [isolated benchmark report](../structural-compare-benchmark.md) records
Bun/Node results and limitations, including the wide-record regression on Bun.
Use an uncurried internal recursive helper while retaining the public curry
contract, and skip key sorting when the freshly collected list is already ordered.
