# Kriya — Swiss Style Work Journal

A chronologically structured, grid-based daily work journal website inspired by Swiss / International Typographic Style.

## Design Principles

- Strict grid system and asymmetric composition
- Clean sans-serif typography
- Strong negative space
- Objective, content-first presentation
- Professional + timeless visual language

## Palette

- #FF3B30
- #000000
- #FFFFFF
- #F5F5F5
- #1A1A1A

## Type

- Headlines: Helvetica Now Display (with Helvetica/Arial fallback)
- Body: Inter

## Files

- `index.html` — structural layout and UI regions
- `styles.css` — Swiss-style system and responsive behavior
- `journal.js` — interactive chronology, filters, stats, and entry modal

## Current behavior

- Timeline view with entry detail panel
- Search + tag filters
- Range slider for chronology window
- Entry creation modal
- Local persistence in browser (`localStorage`)
- Invert mode toggle

## Next step (to fully automate daily 9 PM updates)

To make updates visible across devices and trigger Telegram alerts after each update, the journal should store entries in a repository data file (e.g., `data/entries.json`) and use an automated updater that commits + deploys + notifies Telegram.
