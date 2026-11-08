"use client";
import { useCallback, useEffect, useState } from "react";
import type { PublicEvent, PublicGuest } from "@/lib/guests";
import { isSoundEnabled, setSoundEnabled, unlockAudio } from "@/lib/sound";
import { IntroShell } from "./invitation/IntroShell";
import { InviteBody } from "./invitation/InviteBody";

const SEEN = "jvd:intro-visto";
const DEVICE = "jvd:disp";

/** Número aleatório guardado no browser, para o admin saber em quantos dispositivos o convite foi aberto. */
function deviceId(): string | undefined {
  try {
    let d = localStorage.getItem(DEVICE);
    if (!d) {
      d = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(DEVICE, d);
    }
    return d;
  } catch {
    return undefined;
  }
}

export function Experience({ token, guest, event }: { token: string; guest: PublicGuest; event: PublicEvent }) {
  const [mode, setMode] = useState<"loading" | "intro" | "invite">("loading");
  const [sound, setSound] = useState(true);
  const [introKey, setIntroKey] = useState(0);

  useEffect(() => {
    let seen = false;
    // ?intro=1 força a abertura (útil para pré-visualizar)
    const qs = new URLSearchParams(window.location.search);
    const forced = qs.get("intro") === "1";
    const preview = qs.get("preview") === "1"; // "Ver" no admin: não conta como visita
    try {
      seen = localStorage.getItem(SEEN) === "1";
      const s = localStorage.getItem("jvd:som");
      if (s === "0") {
        setSound(false);
        setSoundEnabled(false);
      }
    } catch {}
    // Quem já respondeu (sim ou não) vai directo ao convite: nada de abertura nem de laço outra vez.
    setMode(!forced && (guest.answered || seen) ? "invite" : "intro");
    // regista a abertura (só aqui, no browser — a pré-visualização do WhatsApp não conta)
    if (!preview) fetch("/api/open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, device: deviceId() }), keepalive: true }).catch(() => {});
  }, [token, guest.answered]);

  useEffect(() => {
    document.documentElement.style.overflow = mode === "invite" ? "" : "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mode]);

  const done = useCallback(() => {
    try {
      localStorage.setItem(SEEN, "1");
    } catch {}
    window.scrollTo(0, 0);
    setMode("invite");
  }, []);

  const toggleSound = () => {
    unlockAudio();
    const v = !isSoundEnabled();
    setSoundEnabled(v);
    setSound(v);
    try {
      localStorage.setItem("jvd:som", v ? "1" : "0");
    } catch {}
  };

  return (
    <>
      <InviteBody token={token} guest={guest} event={event} active={mode === "invite"} />
      {mode === "intro" && <IntroShell key={introKey} guestName={guest.name} plural={guest.plural} onDone={done} />}
      {mode === "loading" && <div className="intro-cover" />}
      <div className="topbar">
        <button className="topbar-btn" onClick={toggleSound} aria-label={sound ? "Desligar som" : "Ligar som"} aria-pressed={sound}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
            {sound ? (
              <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
        {mode === "invite" && (
          <button
            className="topbar-btn topbar-replay"
            onClick={() => {
              setIntroKey((k) => k + 1);
              setMode("intro");
            }}
          >
            Rever a abertura
          </button>
        )}
      </div>
    </>
  );
}
