# Agent Instructions

## Session exports

This repo is a take-home interview submission (Gametime "Checkout Continuity" challenge —
see `docs/02_—_Checkout_Continuity_(Prompt).pdf`). At the end of any Claude Code session that
does substantive work in this repo (planning, implementation, debugging, review), export the
conversation to a Markdown file in `docs/` as a record for the interview.

Naming convention: `docs/session_<YYYY-MM-DD>_<HHMM>_<short-slug>.md`, e.g.
`docs/session_2026-07-27_2100_checkout-continuity-grilling.md`. The slug should describe what
the session covered (e.g. `domain-modeling`, `state-machine-impl`, `web-hydration-fix`) so the
sequence of files reads as a readable history without opening each one.

Include in each export: date/time, a short summary of what was decided or built, and the key
parts of the conversation (condense tool-call noise; keep decisions, tradeoffs, and rationale).

## Variable naming

Avoid single-letter identifiers for anything with meaningful scope (e.g. an `(s) =>` callback
parameter standing in for a session). Spell out what the value is — `session`, not `s`.

This isn't a blanket ban on short names: conventional, narrow-scope idioms (`i`/`j` for loop
counters, `id`, well-established abbreviations) stay legible precisely because they're
conventional, and forcing them into full words tends to hurt readability rather than help it.
Use judgment — the bar is "would a reader have to guess what this holds," not "is it fewer than
N characters."
