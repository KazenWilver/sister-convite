// Service worker mínimo: torna o convite instalável no ecrã principal.
// Não guarda nada em cache (o convite é privado e as respostas mudam): tudo vem da rede.
// Sem rede, mostra uma página simples em vez do erro do browser.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(
    fetch(e.request).catch(
      () =>
        new Response(
          '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Convite da Juceline</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0a1f44;color:#eef5fd;font:16px/1.5 system-ui;text-align:center;padding:24px"><div><p style="font-size:22px;margin:0 0 8px">Sem ligação à internet</p><p style="margin:0;opacity:.8">Liga os dados ou o Wi-Fi e abre o convite outra vez.</p></div>',
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        ),
    ),
  );
});
