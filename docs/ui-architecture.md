# UI Architecture & Visual System

## Goals
- Expressive, non-generic look that feels like a control room dashboard.
- Clear separation of core viewer, shell, and data/interaction layers.
- Reusable design tokens and mixins to keep styles consistent and maintainable.

## Layers
1) **Shell (app component)** – sticky header, page background gradients, global spacing.
2) **Feature layout (hierarchy page)** – hero/metrics, viewer chrome (legend, helper text), details panel.
3) **Viewer** – SVG scene with polished nodes/links, selection/hover states, pan/zoom affordances.
4) **Data/logic** – mock data, node metadata formatting, summary counters.

## Visual system
- Fonts: Display — `Space Grotesk`; Body — `IBM Plex Sans`.
- Palette: warm/teal industrial theme. Tokenized inks (`--ink-900 ...`), surfaces, shadows, radii.
- Components: pills, cards, metrics tiles, legend chips, status pills tied to nodeStyles config.

## Files & structure
- `projects/app-client/src/styles/`
  - `tokens.scss` – CSS variables (colors, radii, shadows, spacing, gradients), font imports.
  - `mixins.scss` – shared mixins (glass, card, pill, text truncation, animations).
  - `global.scss` – base resets, background, selection, typography. Imported by `styles.scss`.
- `projects/app-client/src/app/app.component.*` – shell header + meta pills.
- `projects/app-client/src/app/features/hierarchy/` – page layout, metrics, legend, details.
- `projects/product-hierarchy-viewer/src/lib/*.scss` – viewer-specific styles (nodes, links, selection effects).
- `docs/ui-architecture.md` – this plan; future iterations can add motion specs and component states.

## Implementation phases
1) **Foundation**: add tokens/mixins/global styles; update shell header to use them.
2) **Page chrome**: hero, metrics, legend, viewer chrome, detail card with path/status/type pills.
3) **Viewer polish**: richer node shapes (multi-ring, glow), link styling, hover affordances, empty-state overlay, pan/zoom controls.
4) **Interactions**: quick filters (status chips), focus/zoom-to-node, animated expand/collapse cues.
5) **Theming hooks**: light/dark toggle and density switch (optional).

## Notes
- Keep dependency set unchanged (Angular 18, no D3, no ng-packagr).
- All styling via CSS/SVG; avoid extra packages unless explicitly needed later.
