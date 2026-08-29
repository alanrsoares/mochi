# 0096 — Intrinsic JSX element prop types, validation, and DX

- **Status:** Accepted
- **Date:** 2026-08-29
- **Source:** User request ("jsx html props aren't validated at all"); [ADR 0007](0007-jsx-desugar.md); [ADR 0011](0011-language-plugins.md); [ADR 0055](0055-component-prop-contracts.md); [ADR 0081](0081-string-literal-unions.md); `packages/compiler/src/extensions/plugins/jsx.ts`; `packages/dx/src/complete.ts`

## Context

Universal JSX syntax desugaring ([ADR 0007](0007-jsx-desugar.md), [ADR 0011](0011-language-plugins.md)) desugars lowercase tags (`<button>`, `<div>`, `<input>`) to string-tagged calls (`h("button", props, children)`).

While user components (`<Card />`, `<Icon />`) have their prop rows validated via Algorithm W row unification against their declared or inferred component contracts ([ADR 0055](0055-component-prop-contracts.md)), intrinsic lowercase tags fell through `inferJsxCall` with an unconstrained `ok(tCon("VNode"))`.

This created four major DX gaps:
1. **Zero prop validation:** `<button disbaled="yes" randomAttr={123} class="btn">` compiled without any diagnostics.
2. **Migration pitfalls:** Common JSX mistakes (`class` vs `className`, `for` vs `htmlFor`, lowercase `onclick` vs camelCase `onClick`) went undetected.
3. **No LSP autocomplete for HTML attributes:** `jsxAttrTriggerAt` in `@mochi/dx` skipped all lowercase tags.
4. **No LSP hover on HTML element attributes:** Attribute names had no recorded types (`noteType`) or hover details.

## Decision

1. **Intrinsic Element Schema in `jsxPlugin`:**
   Define a structured schema of standard HTML and SVG elements, global attributes, and event handlers in `packages/compiler/src/extensions/plugins/jsx.ts`.
   - Global attributes: `id`, `className`, `style`, `title`, `hidden`, `tabIndex`, `role`, `dir`, `lang`, `ref`, `key`, `draggable`, `spellCheck`, `contentEditable`, `slot`, etc.
   - Tag-specific attributes: `<button>` (`type: "button" | "submit" | "reset"`, `disabled: bool`, ...), `<input>` (`type: "text" | ...`, `value`, `placeholder`, `checked`, `disabled`, `readOnly`, `required`, ...), `<a>` (`href`, `target: "_blank" | ...`, `rel`, `download`), `<img>` (`src`, `alt`, `loading: "lazy" | "eager"`, ...), `<label>` (`htmlFor`), `<canvas>`, `<svg>`, `<g>`, `<path>`, `<rect>`, `<circle>`, `<line>`, `<text>`, etc.
   - Event handlers: `onClick`, `onKeyDown`, `onInput`, `onChange`, `onSubmit`, `onFocus`, `onBlur`, etc., validated as functions.
   - Open attributes: `data-*` and `aria-*` attributes remain open-world. Custom web components (containing a `-`, e.g. `<my-element>`) remain open-world.

2. **Validation in `inferJsxCall`:**
   When `tagExpr` is a string tag:
   - Look up the element in the intrinsic schema.
   - Validate each attribute against the allowed schema.
   - Catch common JSX mistakes (`class` → `className`, `for` → `htmlFor`, `onclick` → `onClick`, `tabindex` → `tabIndex`).
   - If an attribute is unknown, emit a type `Diagnostic` with a "did you mean" suggestion using Levenshtein distance (`closestName`).
   - Unify the attribute value against the expected type (e.g. `disabled={false}` against `bool`, `type="button"` against literal union `"button" | "submit" | "reset"` per [ADR 0081](0081-string-literal-unions.md)).
   - Call `api.noteType(attrSpan, expectedType, { kind: "property", name: attrName })` so LSP hover displays the exact attribute type.

3. **LSP Completion in `@mochi/dx`:**
   Enable `jsxAttrTriggerAt` in `packages/dx/src/complete.ts` for lowercase intrinsic tags:
   - Typing `<button ` suggests all valid `<button>` attributes (tag-specific → common globals → events → aria).
   - Typing `<button type="` suggests the literal union values `"button"`, `"submit"`, `"reset"`.

## Consequences

- HTML and SVG elements have compile-time type safety for attributes and prop types.
- Typo protection catches misspelled HTML attributes instantly.
- Full LSP autocompletion and hover documentation work out of the box for all standard HTML/SVG elements.
- No runtime overhead; zero coupling to a specific host framework.

## Alternatives Rejected

- **Full closed record in HM prelude:** Rejected, but for a reason worth stating
  precisely. This is how ReScript does it (`JsxDOM.domProps`), and it is the better
  end state: validation would fall out of ordinary row unification instead of a
  bespoke validator. It depends on record fields that may be ABSENT, and mochi's
  rows are `empty | rvar | extend` with no optionality — so a closed `domProps`
  would force every `<div>` to list every attribute. Revisit if optional fields
  land; see [ADR 0097](0097-jsx-schema-single-source.md) for how the schema data is
  kept single-sourced until then.
- **Relying solely on external `.d.ts`:** Rejected ([ADR 0012](0012-host-interop-end-state.md)). Mochi's compiler and DX must be self-contained and fast without running an external TypeScript typechecker.
