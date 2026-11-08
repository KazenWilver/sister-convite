"use client";
import { useEffect, useRef, useState } from "react";
import type { PublicGuest } from "@/lib/guests";
import * as sfx from "@/lib/sound";
import { burst } from "../shared/Confetti";

// Sugestões para quem não sabe o que escrever (a caixa começa vazia).
const IDEAS = [
  "Parabéns, doutora! Muito orgulho em ti.",
  "Mereces cada conquista. Felicidades!",
  "Que esta seja só a primeira de muitas vitórias.",
  "Um brinde à nova licenciada!",
];

async function send(token: string, body: Record<string, unknown>): Promise<PublicGuest> {
  const res = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...body }) });
  const data = (await res.json().catch(() => ({}))) as { guest?: PublicGuest; error?: string };
  if (!res.ok || !data.guest) throw new Error(data.error ?? "Não foi possível guardar. Tenta outra vez.");
  return data.guest;
}

function SeatPicker({ max, value, onChange, plural }: { max: number; value: number; onChange: (n: number) => void; plural: boolean }) {
  if (max <= 1) return null;
  if (max === 2)
    return (
      <div className="seg" role="radiogroup" aria-label="Quantas pessoas">
        {[2, 1].map((n) => (
          <button key={n} role="radio" aria-checked={value === n} className={value === n ? "on" : ""} onClick={() => onChange(n)}>
            {n === 2 ? (plural ? "Vamos os dois" : "Duas pessoas") : "Vou só eu"}
          </button>
        ))}
      </div>
    );
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(1, value - 1))} aria-label="Menos uma pessoa">
        −
      </button>
      <span>
        {value} {value > 1 ? "pessoas" : "pessoa"}
      </span>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label="Mais uma pessoa">
        +
      </button>
    </div>
  );
}

/** Botão "premir e segurar" que aplica o carimbo. */
function HoldStamp({ onDone, disabled }: { onDone: () => void; disabled?: boolean }) {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  const start = useRef(0);
  const HOLD = 1100;
  const stop = () => {
    cancelAnimationFrame(raf.current);
    setP((v) => (v >= 1 ? v : 0));
  };
  const begin = () => {
    if (disabled) return;
    sfx.unlockAudio();
    start.current = performance.now();
    const loop = (t: number) => {
      const v = Math.min(1, (t - start.current) / HOLD);
      setP(v);
      if (v < 1) raf.current = requestAnimationFrame(loop);
      else onDone();
    };
    raf.current = requestAnimationFrame(loop);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <button
      className="hold"
      style={{ "--p": p } as React.CSSProperties}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onDone()}
      onContextMenu={(e) => e.preventDefault()}
      disabled={disabled}
    >
      <span className="hold-ring" aria-hidden="true" />
      <span className="hold-label">{p > 0 && p < 1 ? "Segura…" : "Prime e segura para carimbar"}</span>
    </button>
  );
}

export function Rsvp({ token, initial }: { token: string; initial: PublicGuest }) {
  const [g, setG] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [seats, setSeats] = useState(initial.attending || initial.seats);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState(initial.message ?? "");
  const [msgSent, setMsgSent] = useState(Boolean(initial.message));
  const stampRef = useRef<HTMLDivElement>(null);
  const P = g.plural;

  async function run(body: Record<string, unknown>, after?: (ng: PublicGuest) => void) {
    setBusy(true);
    setError(null);
    try {
      const ng = await send(token, body);
      setG(ng);
      setEditing(false);
      after?.(ng);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const stampFx = () => {
    sfx.stamp(0.7);
    const r = stampRef.current?.getBoundingClientRect();
    if (r) burst(r.left + r.width / 2, r.top + r.height / 2, 110);
  };

  const declined = g.stage2 === "declined" || (g.stage1 === "no" && !g.stage2);
  const canFinal = g.finalOpen && !g.finalLocked;
  let view: "ask" | "waiting" | "final" | "confirmed" | "declined" | "locked" = "ask";
  if (editing) view = "ask";
  else if (g.stage2 === "confirmed") view = "confirmed";
  else if (declined) view = "declined";
  else if (g.stage1 === "yes" && canFinal) view = "final";
  else if (g.stage1 === "yes") view = g.finalOpen && g.finalLocked ? "locked" : "waiting";
  else if (g.finalOpen && g.finalLocked) view = "locked";

  const deadline = g.finalDeadline ? new Date(`${g.finalDeadline}T12:00:00+01:00`).toLocaleDateString("pt-PT", { day: "numeric", month: "long" }) : null;

  return (
    <div className="rsvp">
      <ol className="rsvp-steps" aria-label="Etapas da confirmação">
        <li className={g.stage1 ? "done" : "now"}>
          <span>1</span> Intenção
        </li>
        <li className={g.stage2 ? "done" : g.stage1 === "yes" && g.finalOpen ? "now" : ""}>
          <span>2</span> Confirmação final
        </li>
      </ol>

      <div className={`rsvp-card view-${view}`} key={view}>
        {view === "ask" && (
          <>
            <h3>{P ? "Contam estar connosco?" : "Contas estar connosco?"}</h3>
            <p className="rsvp-sub">Diz-nos já a {P ? "vossa" : "tua"} intenção — ajuda-nos a preparar tudo com carinho.</p>
            <SeatPicker max={g.seats} value={seats} onChange={setSeats} plural={P} />
            <div className="rsvp-actions">
              <button className="btn btn-gold" disabled={busy} onClick={() => run({ action: "stage1", value: "yes", seats }, () => (sfx.toast(0.35), burst(innerWidth / 2, innerHeight * 0.6, 60)))}>
                {P ? "Sim, vamos!" : "Sim, vou!"}
              </button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => run({ action: "stage1", value: "no" })}>
                {P ? "Não vamos conseguir" : "Não vou conseguir"}
              </button>
            </div>
          </>
        )}

        {view === "waiting" && (
          <>
            <p className="rsvp-check" aria-hidden="true">✓</p>
            <h3>{P ? "Que bom! Contamos convosco." : "Que bom! Contamos contigo."}</h3>
            <p className="rsvp-sub">
              Registámos a {P ? "vossa" : "tua"} intenção{g.attending > 1 ? ` (${g.attending} pessoas)` : ""}. Mais perto da data, pedimos aqui mesmo a confirmação final — {P ? "vão" : "vais"}{" "}
              receber um lembrete.
            </p>
            <button className="link" onClick={() => setEditing(true)}>
              Mudar resposta
            </button>
          </>
        )}

        {view === "final" && (
          <>
            <h3>Confirmação final</h3>
            <p className="rsvp-sub">
              {P ? "Confirmam" : "Confirmas"} definitivamente a {P ? "vossa" : "tua"} presença no dia 28?{deadline ? ` Confirma até ${deadline}.` : ""}
            </p>
            <SeatPicker max={g.seats} value={seats} onChange={setSeats} plural={P} />
            <HoldStamp disabled={busy} onDone={() => run({ action: "stage2", value: "confirmed", seats }, () => setTimeout(stampFx, 380))} />
            <button className="link" disabled={busy} onClick={() => run({ action: "stage2", value: "declined" })}>
              Afinal não {P ? "podemos" : "posso"} ir
            </button>
          </>
        )}

        {view === "confirmed" && (
          <>
            <div className="stamp" ref={stampRef} aria-hidden="true">
              <span>Confirmado</span>
              <small>28 · 11 · 2026</small>
            </div>
            <h3>Até dia 28!</h3>
            <p className="rsvp-sub">
              Presença confirmada{g.attending > 1 ? ` para ${g.attending} pessoas` : ""}. A Juceline vai ficar muito feliz.
            </p>
            {canFinal && (
              <button className="link" onClick={() => setEditing(true)}>
                Houve alguma alteração?
              </button>
            )}
          </>
        )}

        {view === "declined" && (
          <>
            <h3>Vamos sentir a {P ? "vossa" : "tua"} falta</h3>
            <p className="rsvp-sub">Obrigado por nos {P ? "avisarem" : "avisares"}. Se os planos mudarem, {P ? "podem" : "podes"} responder outra vez aqui.</p>
            {(!g.finalLocked || !g.stage2) && (
              <button className="link" onClick={() => setEditing(true)}>
                Mudei de ideias
              </button>
            )}
          </>
        )}

        {view === "locked" && (
          <>
            <h3>O prazo terminou</h3>
            <p className="rsvp-sub">A confirmação final já fechou. Se ainda quiseres vir, fala directamente com a família.</p>
          </>
        )}

        {error && (
          <p className="rsvp-error" role="alert">
            {error}
          </p>
        )}
      </div>


      <div className="note">
        <label htmlFor="msg">Deixa uma mensagem para a Juceline</label>
        <p className="note-hint">Escreve à tua maneira ou toca numa sugestão e muda o que quiseres.</p>
        <div className="note-ideas" role="group" aria-label="Sugestões de mensagem">
          {IDEAS.map((t) => (
            <button key={t} type="button" className={msg === t ? "on" : ""} onClick={() => (setMsg(t), setMsgSent(false), sfx.tick(0.2))}>
              {t}
            </button>
          ))}
        </div>
        <textarea id="msg" rows={3} maxLength={600} value={msg} onChange={(e) => (setMsg(e.target.value), setMsgSent(false))} placeholder="A tua mensagem…" />
        <button
          className="btn btn-dark"
          disabled={busy || !msg.trim() || msgSent}
          onClick={() => run({ action: "message", message: msg }, () => (setMsgSent(true), sfx.unfold(0.3)))}
        >
          {msgSent ? "Mensagem entregue ✓" : "Enviar mensagem"}
        </button>
      </div>
    </div>
  );
}
