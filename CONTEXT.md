# Domain Glossary — Checkout Continuity

## Checkout Session

A server-owned record of an in-progress ticket purchase for one listing, identified by an
opaque, unguessable session ID (e.g. UUID/nanoid). The session ID itself is the resume
credential — anyone holding the link or deep link containing it can resume the session. No
fan authentication is required to resume, matching the "send the event to a friend" scenario
in the prompt. This means possession of the ID is capability, not identity: two different
people (or two devices for the same person) can both resume the same session.

## Session States

The checkout session moves through a single state machine (`status` field):

- **active** — session created with inventory held; fan is viewing/resuming; price/inventory
  can still change underneath it.
- **pending_payment** — fan submitted payment; awaiting provider result. This is the window
  where a second device resuming the same session is the actual duplicate-order hazard the
  prompt calls out.
- **completed** — order placed successfully. Terminal.
- **expired** — inventory hold lapsed before completion. Terminal unless the fan starts a
  fresh session (re-priced/re-held).
- **failed** — payment or completion failed. Fan may retry (claims again through
  **pending_payment**) or the session expires.

## Price Reconfirmation

If the listing's price changes while a session is **active** (or **failed**, on retry), the
session cannot proceed straight to **pending_payment**. The fan must explicitly acknowledge
the new price on the surface they're resuming from before payment can be submitted. The
session tracks the price the fan last acknowledged separately from the listing's current
price; a mismatch between the two is what blocks completion. Silent repricing is not
acceptable — this is a domain rule, not a UI nicety.

## Inventory Hold vs. Session Expiration

These are two distinct expirations owned by two distinct services, deliberately not
collapsed into one clock:

- **Inventory Hold** — owned by the (stubbed) Inventory service. Has its own TTL on the
  listing, independent of any session. Represents "this ticket is reserved," not "this
  checkout attempt is active."
- **Session Expiration** — owned by the Checkout Session itself (`expiresAt`). Governs how
  long the _session record_ is resumable at all.

On resume, the session checks current inventory-hold status live rather than assuming its
own `expiresAt` implies the hold is still good — the hold can lapse independently (e.g. a
shorter TTL than the session, or inventory reclaimed for other reasons). A session can be
unexpired but reference inventory that is no longer held; that combination surfaces to the
fan as a distinct "listing no longer available" state, not the same as "session expired."
Conversely, when the session clock itself lapses, checkout also releases the hold
(request-time via `expireIfNeeded`, or in the background via `expireLapsedSessions` /
`SessionExpirySweeper`) so inventory isn't stranded — `expiryReason` stays
`session_lapsed` (why the session died), not `hold_released` (hold disappeared while the
session was still live).
