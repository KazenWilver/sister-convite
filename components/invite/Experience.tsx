"use client";
import { useCallback, useEffect, useState } from "react";
import type { PublicEvent, PublicGuest } from "@/lib/guests";
import { isSoundEnabled, setSoundEnabled, unlockAudio } from "@/lib/sound";
import { IntroScene } from "./IntroScene";
import { InviteBody } from "./InviteBody";

const SEEN = "jvd:intro-visto";

export function Experience({ token, guest, event }: { token: string; guest: PublicGuest; event: PublicEvent }) {
  const [mode, setMode] = useState<"loading" | "intro" | "invite">("loading");
  const [sound, setSound] = useState(true);
  const [introKey, setIntroKey] = useState(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN) === "1";
      const s = localStorage.getItem("jvd:som");
      if (s === "0") {
        setSound(false);
        setSoundEnabled(false);
      }
    } catch {}
    setMode(seen ? "invite" : "intro");
    // regista a abertura (só aqui, no browser — a pré-visualização do WhatsApp não conta)
    fetch("/api/open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), keepalive: true }).catch(() => {});
  }, [token]);

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
      {mode === "intro" && <IntroScene key={introKey} guestName={guest.name} plural={guest.plural} onDone={done} />}
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
