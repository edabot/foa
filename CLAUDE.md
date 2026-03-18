# Festival of Arts – Events Schedule

This project implements a dynamic events schedule for a Wix site using Wix Velo (Corvid).

## Files

### `festival-schedule.js`
Wix page code (Velo) that runs in the browser on the page containing the HTML component. Responsibilities:
- Fetches event data via `getEventsByDaysMethod` (a backend Wix Data method)
- Transforms raw Wix event objects into a flat, serializable shape
- Posts data to the iframe via `$w('#eventsHtml').postMessage()`
- Listens for `RESIZE` messages from the iframe and updates the component height
- Syncs the `#eventsHtml` component width to `window.innerWidth` on load and resize

### `events.html`
A self-contained HTML file loaded into a Wix **HTML Component** (`#eventsHtml`). It has no Wix SDK access — it communicates only via `postMessage`. Responsibilities:
- Renders category filter buttons and event cards
- Handles `LOAD_EVENTS` message to receive days/categories data
- Sends `IFRAME_READY` on load so the parent knows when to post data
- Sends `RESIZE` with `document.body.scrollHeight` so the parent can size the component

### `events.web.js`
Wix backend module (runs server-side). Exports `getEventsByDaysMethod`, which queries Wix Events data and groups results by day.

## Wix-specific notes
- `$w` and `window` are only available inside `$w.onReady()` — do not reference them at module scope
- `window.addEventListener` works inside `$w.onReady` (browser context), but not at the top level (can run SSR)
- The HTML component iframe has a fixed pixel width by default in the Wix Editor; `syncWidth()` overrides this at runtime
- All user-facing strings in `events.html` must be set via `textContent`, not `innerHTML`, to avoid XSS
