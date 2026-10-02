# ADR 0137 — Organize the playground around results

Date: 2026-10-02
Status: Accepted

## Context

The result panel put six destinations in a scrolling tab row, hid examples under
Settings, and centered small previews in a full-height box. Generated formats
competed with results and diagnostics for the same navigation space.

## Decision

Open Preview by default. Keep the example picker visible above three result views:
Preview, Generated code, and Problems. Select JavaScript, TypeScript, or declarations
within Generated code, with an explicit copy action and file label. Render previews
at the top of the content area. Keep the existing split editor, mobile Code/Result
navigation, themes, and fonts.

Tabs use one keyboard stop with arrow, Home, and End navigation. Problems distinguish
an initial unchecked source from a successful compilation. Associate successful
outputs with their source so edits can show an outdated-result notice, including
when automatic compilation is disabled.

## Consequences

Readers reach the visible outcome first and can inspect each compiler target without
crowding the main navigation. This changes docs app presentation and state reporting;
the compiler and generated program semantics are unchanged.
