# CapMark Capture (base)

MV3 extension, no build step. Load unpacked from `chrome://extensions` → `extension/`.

Flow: popup collects `{titulo, url, texto}` → `chrome.storage.local` queue → `bridge.js` (runs on
`http://localhost:5173`) posts it to the page → `escucharCapturas` (src/infrastructure/extension)
validates it and builds a chapter proposal → the UI must show it and the user confirms (S2).

Pending: UI inbox that calls `escucharCapturas`, configurable app origin, packaging.
