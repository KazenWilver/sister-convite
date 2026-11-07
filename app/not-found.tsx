import { Seal } from "@/components/Seal";

export default function NotFound() {
  return (
    <main className="plain paper-grain">
      <div>
        <Seal className="seal" />
        <h1>Convite não encontrado</h1>
        <p>Este link não existe ou já não está activo. Confirma o link com quem to enviou.</p>
      </div>
    </main>
  );
}
