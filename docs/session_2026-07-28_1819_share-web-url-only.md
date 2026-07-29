# Session — Share only the web resume URL

**Date:** 2026-07-28 18:19  
**Slug:** `share-web-url-only`

## Summary

Share/copy was stuffing a custom `mobileweb://` deep link into the body (`Resume checkout:` + `App: …`), which looks broken and isn’t useful to paste. Both surfaces now share/copy only the HTTPS web checkout URL.

## Changes

- Mobile `Share.share`: message/url = `webUrl` only
- Web clipboard: `webUrl` only
- Hint copy: “resume this checkout in any browser”
