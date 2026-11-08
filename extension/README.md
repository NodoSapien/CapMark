# CapMark Capture (base)

MV3 extension, no build step. Load unpacked from `chrome://extensions` → `extension/`.

Flow: popup collects `{titulo, url, texto}` → `chrome.storage.local` queue → `bridge.js` (runs on
`http://localhost:5173`) posts it to the page → `escucharCapturas` (src/infrastructure/extension)
validates it and builds a chapter proposal → `BandejaCapturas` (catalog header) shows it → on confirm, `CapturaService` registers obra + source + progress, and the app acks so the queue clears (S2).

Pending: configurable app origin, packaging, manual test in a real browser.
