"use client";
// «Instalar no telemóvel»: põe o painel no ecrã principal como uma aplicação própria (ícone azul),
// para não ter de abrir o browser e escrever o endereço.
// Android/computador com Chrome ou Edge: instala com um toque (beforeinstallprompt).
// iPhone: a Apple não deixa instalar sozinho, por isso mostramos os 3 toques.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Os = "ios" | "android" | "other";
type IosBrowser = "safari" | "chrome" | "other";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8.5v7M8.5 12h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5.5" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="18.5" r="1.8" fill="currentColor" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function InstallAdmin({ onToast }: { onToast: (m: string) => void }) {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [os, setOs] = useState<Os>("other");
  const [iosBrowser, setIosBrowser] = useState<IosBrowser>("safari");
  const [inApp, setInApp] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [help, setHelp] = useState(false);
  const deferred = useRef<PromptEvent | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setOs(ios ? "ios" : /Android/i.test(ua) ? "android" : "other");
    setIosBrowser(/CriOS/i.test(ua) ? "chrome" : /FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua) ? "other" : "safari");
    setInApp(/FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)|GSA\//i.test(ua));
    setInstalled(isStandalone());
    setReady(true);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as PromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!help) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHelp(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [help]);

  async function install() {
    const p = deferred.current;
    if (p) {
      await p.prompt();
      const { outcome } = await p.userChoice;
      deferred.current = null;
      setCanPrompt(false);
      if (outcome === "accepted") {
        setInstalled(true);
        onToast("Painel instalado: procura o ícone azul «Painel 🎓»");
      }
      return;
    }
    setHelp(true);
  }

  // já aberto como aplicação: o botão não faz falta
  if (!ready || installed) return null;

  const address = `${window.location.host}/admin`;
  const kicker =
    os === "ios" ? (iosBrowser === "chrome" ? "iPhone · Chrome" : iosBrowser === "safari" ? "iPhone · Safari" : "iPhone") : os === "android" ? "Android" : "Computador";

  return (
    <>
      <button className="adm-btn adm-btn-install" onClick={install} data-tour="install">
        <PhoneIcon />
        Instalar no telemóvel
      </button>

      {help &&
        createPortal(
          <div className="adm-inst" role="dialog" aria-modal="true" aria-labelledby="adm-inst-h" onClick={(e) => e.target === e.currentTarget && setHelp(false)}>
            <div className="adm-inst-card">
              <button className="adm-x adm-inst-x" onClick={() => setHelp(false)} aria-label="Fechar">
                ×
              </button>
              <p className="adm-inst-kicker">{kicker}</p>
              <h3 id="adm-inst-h">{os === "other" ? "Abre o painel no telemóvel" : "O painel no ecrã principal"}</h3>

              {os === "other" ? (
                <>
                  <p className="adm-inst-lead">
                    No telemóvel, abre <b>{address}</b>, entra com o PIN e toca em <b>Instalar no telemóvel</b>. O painel fica com um ícone azul, como as outras aplicações.
                  </p>
                  <p className="adm-inst-note">Neste computador, o Chrome e o Edge também o instalam: ícone de instalar ao lado do endereço.</p>
                </>
              ) : (
                <>
                  {inApp && (
                    <p className="adm-inst-warn">
                      {os === "ios"
                        ? "Estás dentro de outra aplicação. Primeiro toca em ⋯ e escolhe «Abrir no Safari»."
                        : "Estás dentro de outra aplicação. Primeiro toca em ⋮ e escolhe «Abrir no Chrome»."}
                    </p>
                  )}
                  {os === "ios" && iosBrowser === "other" && !inApp && (
                    <p className="adm-inst-warn">
                      Neste browser a opção pode não existir. Se não a encontrares, abre <b>{address}</b> no <b>Safari</b>.
                    </p>
                  )}
                  <ol className="adm-inst-steps">
                    {os === "ios" ? (
                      <li>
                        <span className="adm-inst-ico">
                          <ShareIcon />
                        </span>
                        <span>
                          {iosBrowser === "chrome" ? (
                            <>
                              Toca em <b>Partilhar</b>, ao lado do endereço, no canto de cima à direita.
                            </>
                          ) : (
                            <>
                              Toca em <b>Partilhar</b>, na barra do Safari (em baixo ou em cima).
                            </>
                          )}
                        </span>
                      </li>
                    ) : (
                      <li>
                        <span className="adm-inst-ico">
                          <DotsIcon />
                        </span>
                        <span>
                          Toca no menu <b>⋮</b>, no canto de cima do browser.
                        </span>
                      </li>
                    )}
                    <li>
                      <span className="adm-inst-ico">
                        <AddIcon />
                      </span>
                      <span>
                        {os === "ios" ? (
                          <>
                            Desliza a lista e escolhe <b>Adicionar ao ecrã principal</b>.
                          </>
                        ) : (
                          <>
                            Escolhe <b>Instalar aplicação</b> ou <b>Adicionar ao ecrã principal</b>.
                          </>
                        )}
                      </span>
                    </li>
                    <li>
                      <span className="adm-inst-ico adm-inst-ok">✓</span>
                      <span>
                        Confirma com <b>{os === "ios" ? "Adicionar" : "Instalar"}</b>. Aparece o ícone azul <b>Painel 🎓</b>.
                      </span>
                    </li>
                  </ol>
                  {os === "ios" && <p className="adm-inst-note">Na primeira vez que abrires o ícone, o painel pede o PIN outra vez. Depois fica lembrado durante 30 dias.</p>}
                </>
              )}
              <button className="adm-btn adm-btn-primary adm-inst-done" onClick={() => setHelp(false)}>
                Percebi
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
