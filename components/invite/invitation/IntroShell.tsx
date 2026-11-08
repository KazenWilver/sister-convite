"use client";
// Percurso: ecrã de entrada → abertura 2.5D → convite fechado com laço → convite.
// (As versões 2D e 3D continuam em versions/ mas já não são usadas.)
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import * as sfx from "@/lib/sound";
import { Intro25D } from "../versions/25d/Intro25D";
import { ClosedInvite } from "./ClosedInvite";

type Phase = "gate" | "run" | "closed";

export function IntroShell({ guestName, plural, onDone }: { guestName: string; plural: boolean; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("gate");
  const [gateShown, setGateShown] = useState(true);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [reduced, setReduced] = useState(false);
  const gate = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (process.env.NODE_ENV !== "production") (window as unknown as { __gsap: typeof gsap }).__gsap = gsap; // testes
  }, []);

  const start = () => {
    sfx.unlockAudio();
    sfx.toast(0.28);
    setPhase("run"); // a cena monta já, por baixo do portão
    if (reduced || !gate.current) {
      setGateShown(false);
      return;
    }
    const q = gsap.utils.selector(gate.current);
    gsap
      .timeline({ onComplete: () => setGateShown(false) })
      .to(q(".gate-inner > *"), { y: -30, opacity: 0, stagger: 0.05, duration: 0.4, ease: "power2.in" })
      .to(gate.current, { clipPath: "circle(0% at 50% 50%)", duration: 0.7, ease: "power3.inOut" }, 0.2);
  };

  const onRest = useCallback((o: { x: number; y: number }) => {
    setOrigin(o);
    setPhase("closed");
  }, []);

  return (
    <div className="shell">
      {phase !== "gate" && <Intro25D reduced={reduced} onRest={onRest} />}
      {phase === "closed" && origin && <ClosedInvite guestName={guestName} plural={plural} origin={origin} reduced={reduced} onOpen={onDone} />}
      {gateShown && (
        <div className="gate" ref={gate}>
          <div className="gate-inner">
            <p className="gate-for">Para</p>
            <p className="gate-name">{guestName}</p>
            <p className="gate-sub">{plural ? "Há uma coisa à vossa espera." : "Há uma coisa à tua espera."}</p>
            <button className="gate-btn" onClick={start}>
              Abrir o convite
            </button>
            <p className="gate-sound">Liga o som: há uma surpresa para ouvir.</p>
          </div>
        </div>
      )}
    </div>
  );
}
