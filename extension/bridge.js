// Runs on the CapMark app origin. Relays queued captures to the page and clears acked ones.
const QUEUE_KEY = 'capmark.pendientes';

async function enviar() {
  const { [QUEUE_KEY]: cola = [] } = await chrome.storage.local.get(QUEUE_KEY);
  if (cola.length) {
    window.postMessage({ source: 'capmark-ext', type: 'capturas', capturas: cola }, window.location.origin);
  }
}

window.addEventListener('message', async (e) => {
  if (e.source !== window || e.data?.source !== 'capmark-app' || e.data.type !== 'ack') return;
  const ids = new Set(e.data.ids);
  const { [QUEUE_KEY]: cola = [] } = await chrome.storage.local.get(QUEUE_KEY);
  await chrome.storage.local.set({ [QUEUE_KEY]: cola.filter((c) => !ids.has(c.id)) });
});

chrome.storage.onChanged.addListener((cambios) => { if (cambios[QUEUE_KEY]) enviar(); });
enviar();
