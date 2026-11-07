"use client";
import { useState } from "react";
import { Seal } from "@/components/Seal";
import "./admin.css";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Erro ao entrar.");
      setBusy(false);
    }
  }

  return (
    <main className="adm-login paper-grain">
      <form onSubmit={submit} className="adm-login-card">
        <Seal className="adm-login-seal" />
        <h1>Administração</h1>
        <p>Lista de convidados da Juceline</p>
        <label>
          <span>Palavra-passe</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
        </label>
        {error && <p className="adm-error" role="alert">{error}</p>}
        <button className="adm-btn adm-btn-primary" disabled={busy}>
          {busy ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
