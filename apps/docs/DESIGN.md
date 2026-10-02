# Design

## Existing visual system

Captured from src/index.css, src/ui/primitives.mochi, and
public/illustrations/AESTHETICS.md. This records the current system.

## Theme and colors

Use the existing light cream/peach theme and dark cosmic theme, selected by the
reader's system preference or theme control. Colors are OKLCH tokens: paper and
foam for content, peach for chrome, ink and mute for text, line for separators,
fur for selection/actions, and ok for success. The playground uses restrained
accents within these existing themes.

## Typography

Outfit is the app's sans family; JetBrains Mono is used for code and compact
technical labels. Reuse text-xs and text-sm for dense controls and explanations.
Editor inputs use 16px on phones to avoid focus zoom.

## Components and layout

Reuse native select/button/input controls, lucide icons, and existing focus
styles. Pane tabs use a selected underline. The desktop playground splits source
and result with a draggable divider; mobile switches between them. Avoid nested
cards and full-height centered boxes for small results. Separate controls from
content with thin borders; content should use the available width.

## State and motion

Use explicit selected, focus, loading, error, empty, and copied states. Retain
short color transitions; no decorative motion or page-load choreography.
