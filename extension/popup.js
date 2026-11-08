// Collects raw page data from the active tab and queues it in chrome.storage.local.
// The CapMark app (via bridge.js) picks it up and shows it as a proposal to confirm.
const QUEUE_KEY = 'capmark.pendientes';
const $ = (id) => document.getElementById(id);

async function leerPestana() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({
      titulo: document.title,
      url: location.href,
      texto: (document.body?.innerText ?? '').slice(0, 20000),
    }),
  });
  return res.result;
}

let pagina;
leerPestana()
  .then((p) => { pagina = p; $('titulo').value = p.titulo; })
  .catch(() => { $('status').textContent = 'This page cannot be captured.'; });

$('enviar').addEventListener('click', async () => {
  if (!pagina) return;
  const captura = {
    id: crypto.randomUUID(),
    titulo: $('titulo').value.trim() || pagina.titulo,
    url: pagina.url,
    texto: pagina.texto,
    capturadaEn: new Date().toISOString(),
  };
  const { [QUEUE_KEY]: cola = [] } = await chrome.storage.local.get(QUEUE_KEY);
  await chrome.storage.local.set({ [QUEUE_KEY]: [...cola, captura] });
  $('status').textContent = 'Queued. Open CapMark to confirm.';
});
