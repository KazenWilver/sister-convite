"use client";
// "Guardar no telemóvel": instala o convite no ecrã principal, como uma aplicação.
// Android (Chrome, Edge, Samsung): o browser instala com um toque (beforeinstallprompt).
// iPhone: a Apple não deixa nenhum site instalar-se sozinho, por isso mostramos os 3 toques
// necessários, com os mesmos ícones que a pessoa vai ver no ecrã.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as sfx from "@/lib/sound";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Os = "ios" | "android" | "other";

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

export function InstallApp({ plural }: { plural: boolean }) {
  const [os, setOs] = useState<Os>("other");
  const [installed, setInstalled] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [help, setHelp] = useState(false);
  const deferred = useRef<PromptEvent | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setOs(ios ? "ios" : /Android/i.test(ua) ? "android" : "other");
    // WhatsApp, Instagram, Facebook… abrem o link num browser interno que não instala nada
    setInApp(/FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)|GSA\//i.test(ua));
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
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
    sfx.unlockAudio();
    sfx.tick(0.25);
    const p = deferred.current;
    if (p) {
      await p.prompt();
      const { outcome } = await p.userChoice;
      deferred.current = null;
      setCanPrompt(false);
      if (outcome === "accepted") {
        setInstalled(true);
        sfx.toast(0.3);
      }
      return;
    }
    setHelp(true);
  }

  const T = plural ? "vos" : "te";

  return (
    <div className="install" data-from="up">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="install-icon" src="/icons/icon-128.png" width={64} height={64} alt="" />
      <div className="install-text">
        <p className="install-title">{installed ? "Já está no teu ecrã principal" : "Guarda o convite no telemóvel"}</p>
        <p className="install-sub">
          {installed
            ? "Abre-o num toque sempre que precisares: a hora, o local e o mapa estão lá."
            : `Fica no ecrã principal, ao lado das outras aplicações. No dia da festa, um toque mostra-${T} a hora, o local e o caminho até à festa.`}
        </p>
      </div>
      {!installed && (
        <button className="install-btn" onClick={install}>
          <span className="cta-ring" aria-hidden="true" />
          {canPrompt ? "Instalar agora" : "Adicionar ao ecrã principal"}
        </button>
      )}

      {help &&
        createPortal(
        <div className="install-sheet" role="dialog" aria-modal="true" aria-labelledby="install-h" onClick={(e) => e.target === e.currentTarget && setHelp(false)}>
          <div className="install-card">
            <button className="install-close" onClick={() => setHelp(false)} aria-label="Fechar">
              ×
            </button>
            <p className="install-kicker">{os === "ios" ? "iPhone e iPad" : os === "android" ? "Android" : "No telemóvel"}</p>
            <h3 id="install-h">São só três toques</h3>

            {inApp && (
              <p className="install-warn">
                {os === "ios"
                  ? "Abriste o convite dentro do WhatsApp. Primeiro toca em ⋯ ou na bússola e escolhe «Abrir no Safari»."
                  : "Abriste o convite dentro de outra aplicação. Primeiro toca em ⋮ e escolhe «Abrir no Chrome» (ou no browser do telemóvel)."}
              </p>
            )}

            {os === "ios" ? (
              <ol className="install-steps">
                <li>
                  <span className="step-ico">
                    <ShareIcon />
                  </span>
                  <span>
                    Toca no botão <b>Partilhar</b>, na barra do Safari (em baixo ou em cima).
                  </span>
                </li>
                <li>
                  <span className="step-ico">
                    <AddIcon />
                  </span>
                  <span>
                    Desliza a lista e escolhe <b>Adicionar ao ecrã principal</b>.
                  </span>
                </li>
                <li>
                  <span className="step-ico step-ok">✓</span>
                  <span>
                    Toca em <b>Adicionar</b>, no canto de cima. Pronto: o convite fica com o ícone azul.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="install-steps">
                <li>
                  <span className="step-ico">
                    <DotsIcon />
                  </span>
                  <span>
                    Toca no menu <b>⋮</b>, no canto de cima do browser.
                  </span>
                </li>
                <li>
                  <span className="step-ico">
                    <AddIcon />
                  </span>
                  <span>
                    Escolhe <b>Instalar aplicação</b> ou <b>Adicionar ao ecrã principal</b>.
                  </span>
                </li>
                <li>
                  <span className="step-ico step-ok">✓</span>
                  <span>
                    Confirma com <b>Instalar</b> (ou <b>Adicionar</b>). O convite aparece com o ícone azul.
                  </span>
                </li>
              </ol>
            )}
            <button className="btn btn-dark install-done" onClick={() => setHelp(false)}>
              Percebi
            </button>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
